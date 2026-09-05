# Stellar TaskHub

A production-oriented decentralized task and reputation application built on the Stellar Testnet with Soroban smart contracts.

Stellar TaskHub allows users to connect a Stellar wallet, create tasks on-chain, complete those tasks, and earn reputation through inter-contract communication.

## Overview

This project was developed for **Rise In – Stellar Journey to Mastery, Level 3: Orange Belt**.

The project demonstrates:

- Advanced Soroban smart contract development
- Inter-contract communication
- Typed contract events
- Real-time contract event polling
- Stellar wallet integration
- Responsive frontend development
- Error handling and loading states
- Smart contract and frontend testing
- GitHub Actions CI/CD
- Vercel deployment
- Production-oriented project architecture

## Live Demo

**Vercel:**  
https://stellar-taskhub.vercel.app

## Architecture

Stellar TaskHub consists of two Soroban smart contracts and a React frontend.

```text
User
  |
  v
React / Vite Frontend
  |
  v
Stellar Wallet
  |
  v
Task Contract
  |
  | inter-contract call
  v
Reputation Contract
  |
  v
Stellar Testnet

Stellar RPC
  |
  v
Real-time Event Polling
  |
  v
Frontend Contract Activity
```

### Task Contract

The Task Contract manages on-chain tasks.

Main functions:

- `initialize`
- `create_task`
- `complete_task`
- `get_task`
- `get_next_task_id`
- `get_reputation_contract`

When a user completes a task, the Task Contract calls the Reputation Contract.

### Reputation Contract

The Reputation Contract stores reputation scores for Stellar addresses.

Main functions:

- `add_reputation`
- `get_reputation`

Completing a task awards **10 reputation points**.

## Inter-Contract Communication

The core Level 3 feature is communication between the two Soroban contracts.

When `complete_task` executes successfully, the Task Contract invokes:

```text
Reputation Contract -> add_reputation(user, 10)
```

This means the reputation update is performed through a real Soroban inter-contract call rather than being simulated in the frontend.

## Contract Events

The contracts publish typed Soroban events.

### TaskCreated

Published when a new task is created.

Includes:

- Task ID
- Creator address
- Task title

### TaskCompleted

Published when a task is completed.

Includes:

- Task ID
- Creator address

### ReputationUpdated

Published by the Reputation Contract after reputation changes.

The frontend polls Stellar Testnet RPC for contract events and displays recent activity in the **Contract Activity** interface.

## Real-Time Updates

The frontend implements contract event polling using Stellar RPC.

It periodically checks Testnet for new contract events and updates the activity interface when events are discovered.

This provides near-real-time blockchain activity without requiring a page reload.

## Deployed Contracts

Network:

```text
Stellar Testnet
```

### Task Contract

```text
CCKJHNP7T6W5ELZ4DKK4SO6S2Y7HGG7LVVPNOZYEE7OHM2OG5VJRH5QW
```

### Reputation Contract

```text
CB7LFFMFUVADFIYBE2HDTDLGO22TSXAXFUP5EWQTFNMXDSPO2Z2DWZ3FX
```

## Verified Contract Interaction

A real task was created and completed on Stellar Testnet.

### Task Completion Transaction

```text
227de89a1fb9435de0d2912e6a2e0ba8522a345fa941aefc4a3b3605e9b42982
```

Explorer:

https://stellar.expert/explorer/testnet/tx/227de89a1fb9435de0d2912e6a2e0ba8522a345fa941aefc4a3b3605e9b42982

The transaction triggered both task completion and the reputation update flow.

## Contract Deployment

### Reputation Contract Deployment Transaction

```text
b66a494e640f7ddd08881741f418ca0d236ed573f61b456ad5ba0ad68e03cfb
```

Explorer:

https://stellar.expert/explorer/testnet/tx/b66a494e640f7ddd08881741f418ca0d236ed573f61b456ad5ba0ad68e03cfb

### Task Initialization Transaction

```text
f1d9b6ebf5657c504ff4b6180e96a88d0c42a828d75e749532ca9696f94fea3e
```

Explorer:

https://stellar.expert/explorer/testnet/tx/f1d9b6ebf5657c504ff4b6180e96a88d0c42a828d75e749532ca9696f94fea3e

### Task Creation Transaction

```text
2827d05be9728192ac1ddd438e8daa7bede0c46d8638db9a344ef41b9d2bde1b
```

Explorer:

https://stellar.expert/explorer/testnet/tx/2827d05be9728192ac1ddd438e8daa7bede0c46d8638db9a344ef41b9d2bde1b

## Frontend

The frontend is built with:

- React
- Vite
- JavaScript
- Stellar SDK
- Stellar Wallets Kit
- Stellar RPC

Features include:

- Stellar wallet connection
- Testnet support
- On-chain task loading
- Task creation
- Task completion
- Reputation display
- Transaction status feedback
- Loading states
- Error handling
- Contract activity/event display
- Mobile responsive interface

## Mobile Responsive Design

The application includes responsive layouts for desktop and mobile devices.

The interface was tested at a mobile viewport of:

```text
430 x 841
```

The layout adapts cards, navigation, task controls, typography, and content widths for smaller displays.

## Testing

Both smart contracts and the frontend include automated tests.

### Reputation Contract

Run:

```bash
cargo test -p reputation-contract
```

Verified result:

```text
3 passed
0 failed
```

### Task Contract

Run:

```bash
cargo test -p task-contract
```

Verified result:

```text
5 passed
0 failed
```

The Task Contract tests cover task creation, task completion, contract events, and inter-contract reputation updates.

### Frontend

From the `frontend` directory:

```bash
npm run test -- --run
```

The frontend test suite contains at least three passing UI tests covering core interface behavior.

## CI/CD

GitHub Actions automatically validates the project after pushes to the repository.

The CI workflow includes:

### Smart Contracts

- Rust environment setup
- Soroban WASM target setup
- Reputation Contract tests
- Task Contract tests
- Release WASM build

### Frontend

- Node.js environment setup
- Dependency installation
- Vitest frontend tests
- Production frontend build

Successful GitHub Actions runs provide automated verification that the contracts and frontend continue to build and pass their tests.

## Deployment Workflow

The frontend production workflow is:

```text
Developer
   |
   v
Git Commit
   |
   v
GitHub
   |
   +------> GitHub Actions
   |          |
   |          +--> Contract Tests
   |          +--> Frontend Tests
   |          +--> Production Build
   |
   v
Vercel
   |
   v
Production Deployment
```

Vercel deploys the frontend from the GitHub repository.

## Environment Configuration

Create:

```text
frontend/.env
```

Example configuration:

```env
VITE_TASK_CONTRACT_ID=CCKJHNP7T6W5ELZ4DKK4SO6S2Y7HGG7LVVPNOZYEE7OHM2OG5VJRH5QW
VITE_REPUTATION_CONTRACT_ID=CB7LFFMFUVADFIYBE2HDTDLGO22TSXAXFUP5EWQTFNMXDSPOZ2DWZ3FX
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

These values are public Testnet configuration values.

Local `.env` files should not be committed to Git.

## Local Development

### Requirements

Install:

- Node.js
- npm
- Rust
- Stellar CLI

Clone the repository and enter the project directory.

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Building Soroban Contracts

From the repository root:

```bash
stellar contract build
```

Generated WASM contracts are produced in the Rust target directory.

## Project Structure

```text
stellar-taskhub/
|
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|
|-- contracts/
|   |-- task-contract/
|   |   |-- Cargo.toml
|   |   `-- src/
|   |       |-- lib.rs
|   |       `-- test.rs
|   |
|   `-- reputation-contract/
|       |-- Cargo.toml
|       `-- src/
|           |-- lib.rs
|           `-- test.rs
|
|-- frontend/
|   |-- src/
|   |   |-- services/
|   |   |   |-- contracts.js
|   |   |   `-- events.js
|   |   |-- App.jsx
|   |   |-- App.css
|   |   `-- App.test.jsx
|   |
|   |-- package.json
|   `-- .env.example
|
|-- Cargo.toml
`-- README.md
```

## Production Architecture Practices

The application separates blockchain interaction, event handling, UI logic, smart contracts, and tests into dedicated modules.

Production-oriented practices used in the project include:

- Environment-based contract configuration
- Dedicated contract service layer
- Dedicated event polling service
- Automated CI verification
- Contract-level unit tests
- Frontend tests
- Production builds
- Responsive layouts
- Loading and error states
- Git-based deployment workflow
- `.env` exclusion from source control

## Current Limitations

This project runs on **Stellar Testnet** and is intended as an educational Level 3 demonstration.

Before a production/mainnet release, additional security hardening should be considered, including stronger initialization/admin authorization policies, storage lifecycle/TTL strategy, broader integration testing, monitoring, and a formal smart contract security review.

## Demo Flow

A short demonstration can follow this sequence:

1. Open Stellar TaskHub.
2. Show the responsive interface.
3. Connect a Stellar wallet on Testnet.
4. Create a new task.
5. Confirm the wallet transaction.
6. Complete the task.
7. Confirm the completion transaction.
8. Show the updated reputation score.
9. Show the Contract Activity section.
10. Show passing GitHub Actions and automated tests.

## Demo Video

Demo video link:

```text
- [Demo Video 1](https://youtu.be/gkzIAAP87d4)
- [Demo Video 2](https://youtu.be/R0z0c5xwNFI)
```

## Level 3 Requirements

| Requirement | Implementation |
|---|---|
| Advanced smart contract development | Task and Reputation Soroban contracts |
| Inter-contract communication | Task Contract invokes Reputation Contract |
| Event streaming / real-time updates | Stellar RPC contract event polling |
| CI/CD pipeline | GitHub Actions |
| Smart contract deployment | Contracts deployed to Stellar Testnet |
| Mobile responsive frontend | Responsive React interface |
| Error handling and loading states | Implemented in frontend transaction flow |
| Contract tests | 8 passing contract tests |
| Frontend tests | 3+ passing tests |
| Production architecture practices | Modular services, environment config and CI |
| Documentation | Complete project README |
| Live demo | Vercel deployment |

## License

This project was created for educational purposes as part of the Rise In Stellar Journey to Mastery program.