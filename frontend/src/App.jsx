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

StellarWalletsKit.init({
  modules: defaultModules(),
});

StellarWalletsKit.setNetwork(Networks.TESTNET);

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [reputation, setReputation] = useState(0);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);

  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const connectWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError("");

      const { address } =
        await StellarWalletsKit.authModal();

      setWalletAddress(address);
    } catch (error) {
      console.error("Wallet connection error:", error);

      setWalletError(
        "Wallet connection failed. Please try again."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      setContractError("");

      const nextTaskId = Number(
        await getNextTaskId()
      );

      const loadedTasks = [];

      for (let id = 1; id < nextTaskId; id++) {
        try {
          const task = await getTask(id);

          loadedTasks.push({
            id: Number(task.id),
            title: String(task.title),
            creator: String(task.creator),
            completed: Boolean(task.completed),
          });
        } catch (error) {
          console.error(
            `Could not load task ${id}:`,
            error
          );
        }
      }

      setTasks(loadedTasks);

      if (walletAddress) {
        const score =
          await getReputation(walletAddress);

        setReputation(Number(score));
      } else {
        setReputation(0);
      }
    } catch (error) {
      console.error(
        "Blockchain loading error:",
        error
      );

      setContractError(
        "Could not load Stellar contract data."
      );
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, [walletAddress]);

  const handleCreateTask = async () => {
    if (!walletAddress) {
      setContractError(
        "Connect your wallet before creating a task."
      );
      return;
    }

    if (!newTaskTitle.trim()) {
      setContractError(
        "Please enter a task title."
      );
      return;
    }

    try {
      setContractLoading(true);
      setContractError("");
      setTransactionHash("");

      const response = await createTask(
        walletAddress,
        newTaskTitle
      );

      setTransactionHash(response.hash);
      setNewTaskTitle("");
      setShowNewTask(false);

      await loadBlockchainData();
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      setContractError(
        error?.message ||
          "Task creation failed."
      );
    } finally {
      setContractLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!walletAddress) {
      setContractError(
        "Connect your wallet before completing a task."
      );
      return;
    }

    try {
      setContractLoading(true);
      setContractError("");
      setTransactionHash("");

      const response = await completeTask(
        walletAddress,
        taskId
      );

      setTransactionHash(response.hash);

      await loadBlockchainData();
    } catch (error) {
      console.error(
        "Complete task error:",
        error
      );

      setContractError(
        error?.message ||
          "Task completion failed."
      );
    } finally {
      setContractLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            STELLAR TESTNET
          </p>

          <h1>TaskHub</h1>
        </div>

        <div>
          <button
            className="wallet-button"
            onClick={connectWallet}
            disabled={walletLoading}
          >
            {walletLoading
              ? "Connecting..."
              : walletAddress
                ? `${walletAddress.slice(
                    0,
                    5
                  )}...${walletAddress.slice(
                    -5
                  )}`
                : "Connect Wallet"}
          </button>

          {walletError && (
            <p className="wallet-error">
              {walletError}
            </p>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            ON-CHAIN PRODUCTIVITY
          </p>

          <h2>
            Complete tasks.
            <br />
            Build your reputation.
          </h2>

          <p className="hero-description">
            Create tasks on Stellar,
            complete them on-chain,
            and earn reputation through
            smart contract interactions.
          </p>
        </div>

        <div className="stats-card">
          <span>Reputation Score</span>

          <strong>{reputation}</strong>

          <small>
            +10 per completed task
          </small>
        </div>
      </section>

      <section className="dashboard">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              YOUR WORK
            </p>

            <h3>Tasks</h3>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowNewTask(
                (current) => !current
              )
            }
          >
            + New Task
          </button>
        </div>

        {showNewTask && (
          <div className="new-task-form">
            <input
              type="text"
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(event) =>
                setNewTaskTitle(
                  event.target.value
                )
              }
              disabled={contractLoading}
            />

            <button
              className="primary-button"
              onClick={handleCreateTask}
              disabled={contractLoading}
            >
              {contractLoading
                ? "Processing..."
                : "Create on Stellar"}
            </button>
          </div>
        )}

        {contractError && (
          <p className="wallet-error">
            {contractError}
          </p>
        )}

        {transactionHash && (
          <div className="transaction-status">
            <strong>
              Transaction confirmed ✓
            </strong>

            <p>
              {transactionHash.slice(0, 16)}
              ...
              {transactionHash.slice(-10)}
            </p>
          </div>
        )}

        <div className="task-grid">
          {tasks.length === 0 ? (
            <article className="task-card">
              <h4>No tasks found</h4>

              <p>
                Create your first on-chain task.
              </p>
            </article>
          ) : (
            tasks.map((task) => (
              <article
                className="task-card"
                key={task.id}
              >
                <div className="task-card-top">
                  <span
                    className={`status ${
                      task.completed
                        ? "completed"
                        : "active"
                    }`}
                  >
                    {task.completed
                      ? "Completed"
                      : "Active"}
                  </span>

                  <span className="reward">
                    +10 REP
                  </span>
                </div>

                <h4>{task.title}</h4>

                <p>
                  Task #{task.id}
                </p>

                <button
                  className="task-action"
                  onClick={() =>
                    handleCompleteTask(
                      task.id
                    )
                  }
                  disabled={
                    task.completed ||
                    contractLoading
                  }
                >
                  {task.completed
                    ? "Completed"
                    : contractLoading
                      ? "Processing..."
                      : "Complete Task"}
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="activity-panel">
        <div>
          <p className="eyebrow">
            REAL-TIME
          </p>

          <h3>Contract Activity</h3>
        </div>

        <div className="activity-item">
          <span className="activity-dot" />

          <div>
            <strong>
              Stellar Testnet
            </strong>

            <p>
              {transactionHash
                ? "Latest contract transaction confirmed"
                : "Waiting for contract activity"}
            </p>
          </div>

          <small>
            {transactionHash
              ? "just now"
              : "live"}
          </small>
        </div>
      </section>
    </main>
  );
}

export default App;