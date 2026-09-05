import {
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

import { TASK_CONTRACT_ID, REPUTATION_CONTRACT_ID, RPC_URL } from "./contracts";

const server = new rpc.Server(RPC_URL);

const CONTRACT_IDS = [
  TASK_CONTRACT_ID,
  REPUTATION_CONTRACT_ID,
].filter(Boolean);

function readEventName(event) {
  try {
    if (
      !event.topic ||
      event.topic.length === 0
    ) {
      return "ContractEvent";
    }

    return String(
      scValToNative(event.topic[0])
    );
  } catch (error) {
    console.warn(
      "Could not decode event name:",
      error
    );

    return "ContractEvent";
  }
}

function readEventTopics(event) {
  try {
    return event.topic.map((topic) =>
      scValToNative(topic)
    );
  } catch (error) {
    console.warn(
      "Could not decode event topics:",
      error
    );

    return [];
  }
}

function readEventValue(event) {
  try {
    return scValToNative(
      event.value
    );
  } catch (error) {
    console.warn(
      "Could not decode event value:",
      error
    );

    return null;
  }
}

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

  const response =
    await server.getEvents({
      startLedger,

      filters: [
        {
          type: "contract",
          contractIds:
            CONTRACT_IDS,
        },
      ],

      limit: 50,
    });

  return response.events
    .map((event) => {
      const decodedTopics =
        readEventTopics(event);

      return {
        id: event.id,

        name:
          readEventName(event),

        contractId:
          event.contractId,

        ledger:
          event.ledger,

        ledgerClosedAt:
          event.ledgerClosedAt,

        txHash:
          event.txHash,

        topic:
          event.topic,

        decodedTopics,

        value:
          event.value,

        decodedValue:
          readEventValue(event),

        successful:
          event.inSuccessfulContractCall,
      };
    })
    .reverse();
}

export function startEventPolling({
  onEvents,
  onError,
  interval = 4000,
}) {
  let stopped = false;
  let timer = null;

  let previousEventIds =
    new Set();

  const poll = async () => {
    try {
      const events =
        await getRecentContractEvents();

      if (stopped) {
        return;
      }

      const newEvents =
        events.filter(
          (event) =>
            !previousEventIds.has(
              event.id
            )
        );

      previousEventIds =
        new Set(
          events.map(
            (event) => event.id
          )
        );

      onEvents?.(
        events,
        newEvents
      );
    } catch (error) {
      console.error(
        "Contract event polling failed:",
        error
      );

      onError?.(error);
    } finally {
      if (!stopped) {
        timer =
          window.setTimeout(
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
      window.clearTimeout(
        timer
      );
    }
  };
}
