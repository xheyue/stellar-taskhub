import { rpc } from "@stellar/stellar-sdk";

const RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL ||
  "https://soroban-testnet.stellar.org";

const TASK_CONTRACT_ID =
  import.meta.env.VITE_TASK_CONTRACT_ID;

const REPUTATION_CONTRACT_ID =
  import.meta.env.VITE_REPUTATION_CONTRACT_ID;

const server = new rpc.Server(RPC_URL);

const CONTRACT_IDS = [
  TASK_CONTRACT_ID,
  REPUTATION_CONTRACT_ID,
].filter(Boolean);

export async function getRecentContractEvents() {
  if (CONTRACT_IDS.length === 0) {
    return [];
  }

  const latestLedger =
    await server.getLatestLedger();

  const startLedger = Math.max(
    1,
    latestLedger.sequence - 2000
  );

  const response = await server.getEvents({
    startLedger,

    filters: [
      {
        type: "contract",
        contractIds: CONTRACT_IDS,
      },
    ],

    limit: 50,
  });

  return response.events
    .map((event) => ({
      id: event.id,
      contractId: event.contractId,
      ledger: event.ledger,
      txHash: event.txHash,
      topic: event.topic,
      value: event.value,
    }))
    .reverse();
}

export function startEventPolling({
  onEvents,
  onError,
  interval = 4000,
}) {
  let stopped = false;
  let timer = null;
  let previousEventIds = new Set();

  const poll = async () => {
    try {
      const events =
        await getRecentContractEvents();

      if (stopped) {
        return;
      }

      const newEvents = events.filter(
        (event) =>
          !previousEventIds.has(event.id)
      );

      previousEventIds = new Set(
        events.map((event) => event.id)
      );

      if (newEvents.length > 0) {
        onEvents?.(events, newEvents);
      }
    } catch (error) {
      console.error(
        "Contract event polling failed:",
        error
      );

      onError?.(error);
    } finally {
      if (!stopped) {
        timer = window.setTimeout(
          poll,
          interval
        );
      }
    }
  };

  poll();

  return () => {
    stopped = true;

    if (timer) {
      window.clearTimeout(timer);
    }
  };
}