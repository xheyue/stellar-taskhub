import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";

const TASK_CONTRACT_ID =
  import.meta.env.VITE_TASK_CONTRACT_ID;

const REPUTATION_CONTRACT_ID =
  "CB7LFFMFUVADFIYBE2HDTDLGO22TSXAXFUP5EWQTFNMXDSPOZ2DWZ3FX";

const RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL ||
  "https://soroban-testnet.stellar.org";

const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);

const taskContract = new Contract(
  TASK_CONTRACT_ID
);

const reputationContract = new Contract(
  REPUTATION_CONTRACT_ID
);

async function getSourceAccount(address) {
  const account = await server.getAccount(address);

  return new Account(
    account.accountId(),
    account.sequenceNumber()
  );
}

async function signAndSendTransaction(
  transaction,
  walletAddress
) {
  const preparedTransaction =
    await server.prepareTransaction(transaction);

  const transactionXdr =
    preparedTransaction.toXDR();

  const { signedTxXdr } =
    await StellarWalletsKit.signTransaction(
      transactionXdr,
      {
        address: walletAddress,
        networkPassphrase:
          NETWORK_PASSPHRASE,
      }
    );

  const signedTransaction =
    TransactionBuilder.fromXDR(
      signedTxXdr,
      NETWORK_PASSPHRASE
    );

  const sendResponse =
    await server.sendTransaction(
      signedTransaction
    );

  if (sendResponse.status === "ERROR") {
    throw new Error(
      "Stellar rejected the transaction."
    );
  }

  const transactionHash =
    sendResponse.hash;

  let result;

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    result =
      await server.getTransaction(
        transactionHash
      );

    if (result.status === "SUCCESS") {
      return {
        hash: transactionHash,
        result,
      };
    }

    if (result.status === "FAILED") {
      throw new Error(
        "Transaction failed on Stellar Testnet."
      );
    }
  }

  throw new Error(
    "Transaction confirmation timed out."
  );
}

async function buildTransaction(
  walletAddress,
  operation
) {
  const sourceAccount =
    await getSourceAccount(walletAddress);

  return new TransactionBuilder(
    sourceAccount,
    {
      fee: BASE_FEE,
      networkPassphrase:
        NETWORK_PASSPHRASE,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();
}

export async function createTask(
  walletAddress,
  title
) {
  if (!walletAddress) {
    throw new Error(
      "Connect your wallet first."
    );
  }

  if (!title?.trim()) {
    throw new Error(
      "Task title cannot be empty."
    );
  }

  const operation =
    taskContract.call(
      "create_task",
      new Address(
        walletAddress
      ).toScVal(),
      nativeToScVal(title.trim(), {
        type: "string",
      })
    );

  const transaction =
    await buildTransaction(
      walletAddress,
      operation
    );

  return signAndSendTransaction(
    transaction,
    walletAddress
  );
}

export async function completeTask(
  walletAddress,
  taskId
) {
  if (!walletAddress) {
    throw new Error(
      "Connect your wallet first."
    );
  }

  const operation =
    taskContract.call(
      "complete_task",
      new Address(
        walletAddress
      ).toScVal(),
      nativeToScVal(Number(taskId), {
        type: "u32",
      })
    );

  const transaction =
    await buildTransaction(
      walletAddress,
      operation
    );

  return signAndSendTransaction(
    transaction,
    walletAddress
  );
}

async function simulateRead(operation) {
  const source =
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

  const sourceAccount =
    new Account(source, "0");

  const transaction =
    new TransactionBuilder(
      sourceAccount,
      {
        fee: BASE_FEE,
        networkPassphrase:
          NETWORK_PASSPHRASE,
      }
    )
      .addOperation(operation)
      .setTimeout(30)
      .build();

  const simulation =
    await server.simulateTransaction(
      transaction
    );

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(
      simulation.error ||
        "Contract simulation failed."
    );
  }

  if (
    !simulation.result ||
    !simulation.result.retval
  ) {
    throw new Error(
      "Contract returned no value."
    );
  }

  return scValToNative(
    simulation.result.retval
  );
}

export async function getReputation(
  walletAddress
) {
  if (!walletAddress) {
    return 0;
  }

  const operation =
    reputationContract.call(
      "get_reputation",
      new Address(
        walletAddress
      ).toScVal()
    );

  return simulateRead(operation);
}

export async function getNextTaskId() {
  const operation =
    taskContract.call(
      "get_next_task_id"
    );

  return simulateRead(operation);
}

export async function getTask(taskId) {
  const operation =
    taskContract.call(
      "get_task",
      nativeToScVal(Number(taskId), {
        type: "u32",
      })
    );

  return simulateRead(operation);
}

export {
  TASK_CONTRACT_ID,
  REPUTATION_CONTRACT_ID,
  RPC_URL,
};

