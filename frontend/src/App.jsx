import { useEffect, useState } from "react";
import "./App.css";

import { Networks } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

import {
  createTask,
  completeTask,
  getReputation,
  getTask,
  getNextTaskId,
} from "./services/contracts";

import {
  startEventPolling,
} from "./services/events";

StellarWalletsKit.init({
  modules: defaultModules(),
});

StellarWalletsKit.setNetwork(
  Networks.TESTNET
);

function App() {
  const [walletAddress, setWalletAddress] =
    useState("");

  const [walletError, setWalletError] =
    useState("");

  const [walletLoading, setWalletLoading] =
    useState(false);

  const [tasks, setTasks] =
    useState([]);

  const [reputation, setReputation] =
    useState(0);

  const [newTaskTitle, setNewTaskTitle] =
    useState("");

  const [showNewTask, setShowNewTask] =
    useState(false);

  const [contractLoading, setContractLoading] =
    useState(false);

  const [contractError, setContractError] =
    useState("");

  const [transactionHash, setTransactionHash] =
    useState("");

  const [contractEvents, setContractEvents] =
    useState([]);

  const [
    eventStreamStatus,
    setEventStreamStatus,
  ] = useState("connecting");

  const [
    eventStreamError,
    setEventStreamError,
  ] = useState("");

  const shortenAddress = (address) => {
    if (!address) {
      return "";
    }

    return `${address.slice(
      0,
      5
    )}...${address.slice(-5)}`;
  };

  const shortenHash = (hash) => {
    if (!hash) {
      return "";
    }

    return `${hash.slice(
      0,
      16
    )}...${hash.slice(-10)}`;
  };

  const connectWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError("");

      const { address } =
        await StellarWalletsKit.authModal();

      if (!address) {
        throw new Error(
          "Wallet connection was cancelled."
        );
      }

      setWalletAddress(address);
    } catch (error) {
      console.error(
        "Wallet connection failed:",
        error
      );

      setWalletError(
        error?.message ||
          "Could not connect wallet."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      setContractError("");

      const nextTaskId =
        await getNextTaskId();

      const loadedTasks = [];

      for (
        let taskId = 1;
        taskId < Number(nextTaskId);
        taskId++
      ) {
        try {
          const task =
            await getTask(taskId);

          loadedTasks.push({
            id: Number(task.id),
            creator: String(task.creator),
            title: String(task.title),
            completed: Boolean(
              task.completed
            ),
          });
        } catch (error) {
          console.warn(
            `Could not load task ${taskId}:`,
            error
          );
        }
      }

      setTasks(loadedTasks);

      if (walletAddress) {
        const score =
          await getReputation(
            walletAddress
          );

        setReputation(
          Number(score)
        );
      } else {
        setReputation(0);
      }
    } catch (error) {
      console.error(
        "Blockchain data loading failed:",
        error
      );

      setContractError(
        error?.message ||
          "Could not load blockchain data."
      );
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, [walletAddress]);

  useEffect(() => {
    const stopPolling =
      startEventPolling({
        onEvents: (
          allEvents,
          newEvents
        ) => {
          setContractEvents(
            allEvents
          );

          setEventStreamStatus(
            "connected"
          );

          setEventStreamError("");

          if (
            newEvents.length > 0
          ) {
            loadBlockchainData();
          }
        },

        onError: (error) => {
          console.error(
            "Event stream error:",
            error
          );

          setEventStreamStatus(
            "error"
          );

          setEventStreamError(
            error?.message ||
              "Event stream failed."
          );
        },

        interval: 4000,
      });

    return () => {
      stopPolling();
    };
  }, [walletAddress]);

  const handleCreateTask =
    async (event) => {
      event.preventDefault();

      if (!walletAddress) {
        setContractError(
          "Connect your wallet first."
        );

        return;
      }

      if (!newTaskTitle.trim()) {
        setContractError(
          "Enter a task title."
        );

        return;
      }

      try {
        setContractLoading(true);
        setContractError("");
        setTransactionHash("");

        const response =
          await createTask(
            walletAddress,
            newTaskTitle
          );

        setTransactionHash(
          response.hash
        );

        setNewTaskTitle("");
        setShowNewTask(false);

        await loadBlockchainData();
      } catch (error) {
        console.error(
          "Create task failed:",
          error
        );

        setContractError(
          error?.message ||
            "Could not create task."
        );
      } finally {
        setContractLoading(false);
      }
    };

  const handleCompleteTask =
    async (taskId) => {
      if (!walletAddress) {
        setContractError(
          "Connect your wallet first."
        );

        return;
      }

      try {
        setContractLoading(true);
        setContractError("");
        setTransactionHash("");

        const response =
          await completeTask(
            walletAddress,
            taskId
          );

        setTransactionHash(
          response.hash
        );

        await loadBlockchainData();
      } catch (error) {
        console.error(
          "Complete task failed:",
          error
        );

        setContractError(
          error?.message ||
            "Could not complete task."
        );
      } finally {
        setContractLoading(false);
      }
    };

  const getEventLabel = (
  event,
  index
) => {
  if (!event) {
    return `Contract Event ${index + 1}`;
  }

  switch (event.name) {
    case "task_created":
      return "Task Created";

    case "task_completed":
      return "Task Completed";

    case "reputation_updated":
      return "Reputation Updated";

    default:
      return (
        event.name ||
        "Contract Event"
      );
  }
};
const getEventDescription = (
  event
) => {
  if (!event) {
    return "";
  }

  const topics =
    event.decodedTopics || [];

  if (
    event.name ===
    "task_created"
  ) {
    const taskId =
      topics[1];

    return `Task #${taskId} created`;
  }

  if (
    event.name ===
    "task_completed"
  ) {
    const taskId =
      topics[1];

    return `Task #${taskId} completed`;
  }

  if (
    event.name ===
    "reputation_updated"
  ) {
    const value =
      event.decodedValue;

    if (
      value &&
      typeof value === "object"
    ) {
      const score =
        value.new_score ??
        value.newScore ??
        value.score;

      if (
        score !== undefined
      ) {
        return `Reputation updated to ${score}`;
      }
    }

    return "Reputation score updated";
  }

  return `Ledger ${event.ledger}`;
};

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            S
          </div>

          <div>
            <h1>Stellar TaskHub</h1>

            <p>
              On-chain task &
              reputation system
            </p>
          </div>
        </div>

        <div className="wallet-area">
          <span className="network-pill">
            ● Testnet
          </span>

          <button
            className="wallet-button"
            onClick={connectWallet}
            disabled={walletLoading}
          >
            {walletLoading
              ? "Connecting..."
              : walletAddress
              ? shortenAddress(
                  walletAddress
                )
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="hero-section">
          <div>
            <span className="eyebrow">
              LEVEL 3 • STELLAR
              SOROBAN
            </span>

            <h2>
              Build. Complete.
              <br />
              Earn reputation.
            </h2>

            <p className="hero-copy">
              Create tasks on Stellar
              Testnet, complete them
              on-chain and earn
              reputation through
              inter-contract
              communication.
            </p>
          </div>

          <div className="reputation-card">
            <span className="card-label">
              Reputation Score
            </span>

            <strong>
              {reputation}
            </strong>

            <span className="card-caption">
              On-chain reputation
            </span>
          </div>
        </section>

        {walletError && (
          <div className="error-banner">
            {walletError}
          </div>
        )}

        {contractError && (
          <div className="error-banner">
            {contractError}
          </div>
        )}

        <section className="tasks-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                TASKS
              </span>

              <h3>
                Your on-chain tasks
              </h3>
            </div>

            <button
              className="primary-button"
              onClick={() =>
                setShowNewTask(
                  !showNewTask
                )
              }
            >
              + New Task
            </button>
          </div>

          {showNewTask && (
            <form
              className="new-task-form"
              onSubmit={
                handleCreateTask
              }
            >
              <input
                type="text"
                placeholder="What do you want to accomplish?"
                value={newTaskTitle}
                onChange={(event) =>
                  setNewTaskTitle(
                    event.target.value
                  )
                }
                disabled={
                  contractLoading
                }
              />

              <button
                type="submit"
                className="primary-button"
                disabled={
                  contractLoading
                }
              >
                {contractLoading
                  ? "Waiting for Stellar..."
                  : "Create on Stellar"}
              </button>
            </form>
          )}

          {contractLoading && (
            <div className="loading-card">
              <span className="spinner" />

              <div>
                <strong>
                  Processing
                  transaction
                </strong>

                <p>
                  Confirm the
                  transaction in your
                  wallet and wait for
                  Stellar Testnet.
                </p>
              </div>
            </div>
          )}

          {transactionHash && (
            <div className="success-banner">
              <div>
                <strong>
                  Transaction
                  confirmed ✓
                </strong>

                <p>
                  {shortenHash(
                    transactionHash
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="task-grid">
            {tasks.length === 0 ? (
              <div className="empty-card">
                <h4>
                  No tasks yet
                </h4>

                <p>
                  Create your first
                  task on Stellar
                  Testnet.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <article
                  className={`task-card ${
                    task.completed
                      ? "completed"
                      : ""
                  }`}
                  key={task.id}
                >
                  <div className="task-top">
                    <span className="task-number">
                      Task #{task.id}
                    </span>

                    <span
                      className={`status-pill ${
                        task.completed
                          ? "done"
                          : "active"
                      }`}
                    >
                      {task.completed
                        ? "Completed"
                        : "Active"}
                    </span>
                  </div>

                  <h4>
                    {task.title}
                  </h4>

                  <p className="creator">
                    Creator:{" "}
                    {shortenAddress(
                      task.creator
                    )}
                  </p>

                  {!task.completed &&
                    walletAddress &&
                    task.creator ===
                      walletAddress && (
                      <button
                        className="complete-button"
                        onClick={() =>
                          handleCompleteTask(
                            task.id
                          )
                        }
                        disabled={
                          contractLoading
                        }
                      >
                        Complete Task
                      </button>
                    )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="activity-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                REAL-TIME
              </span>

              <h3>
                Contract Activity
              </h3>
            </div>

            <span
              className={`stream-status ${eventStreamStatus}`}
            >
              {eventStreamStatus ===
              "connected"
                ? "● Live"
                : eventStreamStatus ===
                  "error"
                ? "● Error"
                : "● Connecting"}
            </span>
          </div>

          {eventStreamError && (
            <div className="error-banner">
              {eventStreamError}
            </div>
          )}

          <div className="activity-list">
            {contractEvents.length ===
            0 ? (
              <div className="activity-item">
                <div className="activity-dot" />

                <div>
                  <strong>
                    Waiting for contract
                    events
                  </strong>

                  <p>
                    Stellar TaskHub
                    checks Testnet every
                    4 seconds.
                  </p>
                </div>
              </div>
            ) : (
              contractEvents
                .slice(0, 8)
                .map(
                  (
                    contractEvent,
                    index
                  ) => (
                    <div
                      className="activity-item"
                      key={
                        contractEvent.id ||
                        `${contractEvent.txHash}-${index}`
                      }
                    >
                      <div className="activity-dot" />

                      <div>
                        <strong>
                          {getEventLabel(
                            contractEvent,
                            index
                          )}
                        </strong>

                        <p>
                          {getEventDescription(
                            contractEvent
                          )}
                        </p>

                        <p>
                          Ledger{" "}
                          {
                            contractEvent.ledger
                          }
                          {" • "}
                          {shortenHash(
                            contractEvent.txHash
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )
            )}
          </div>
        </section>

        <section className="architecture-section">
          <span className="eyebrow">
            ARCHITECTURE
          </span>

          <h3>
            Inter-contract
            communication
          </h3>

          <div className="architecture-flow">
            <div className="architecture-box">
              <strong>
                React Frontend
              </strong>

              <span>
                Wallet + Stellar SDK
              </span>
            </div>

            <span className="flow-arrow">
              →
            </span>

            <div className="architecture-box">
              <strong>
                Task Contract
              </strong>

              <span>
                Create & complete
                tasks
              </span>
            </div>

            <span className="flow-arrow">
              →
            </span>

            <div className="architecture-box">
              <strong>
                Reputation Contract
              </strong>

              <span>
                On-chain reputation
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>
          Stellar TaskHub • Soroban
          Testnet
        </span>

        <span>
          Event polling every 4s
        </span>
      </footer>
    </div>
  );
}

export default App;