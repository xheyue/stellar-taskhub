import "./App.css";

const sampleTasks = [
  {
    id: 1,
    title: "Deploy reputation contract",
    status: "completed",
    reward: 10,
  },
  {
    id: 2,
    title: "Connect Stellar wallet",
    status: "active",
    reward: 10,
  },
  {
    id: 3,
    title: "Build responsive dashboard",
    status: "active",
    reward: 10,
  },
];

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">STELLAR TESTNET</p>
          <h1>TaskHub</h1>
        </div>

        <button className="wallet-button">
          Connect Wallet
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ON-CHAIN PRODUCTIVITY</p>
          <h2>
            Complete tasks.
            <br />
            Build your reputation.
          </h2>

          <p className="hero-description">
            Create tasks on Stellar, complete them on-chain,
            and earn reputation through smart contract
            interactions.
          </p>
        </div>

        <div className="stats-card">
          <span>Reputation Score</span>
          <strong>20</strong>
          <small>+10 per completed task</small>
        </div>
      </section>

      <section className="dashboard">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR WORK</p>
            <h3>Tasks</h3>
          </div>

          <button className="primary-button">
            + New Task
          </button>
        </div>

        <div className="task-grid">
          {sampleTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-top">
                <span className={`status ${task.status}`}>
                  {task.status === "completed"
                    ? "Completed"
                    : "Active"}
                </span>

                <span className="reward">
                  +{task.reward} REP
                </span>
              </div>

              <h4>{task.title}</h4>

              <p>Task #{task.id}</p>

              <button
                className="task-action"
                disabled={task.status === "completed"}
              >
                {task.status === "completed"
                  ? "Completed"
                  : "Complete Task"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="activity-panel">
        <div>
          <p className="eyebrow">REAL-TIME</p>
          <h3>Contract Activity</h3>
        </div>

        <div className="activity-item">
          <span className="activity-dot" />
          <div>
            <strong>TaskCompleted</strong>
            <p>Reputation updated to 20</p>
          </div>
          <small>just now</small>
        </div>
      </section>
    </main>
  );
}

export default App;