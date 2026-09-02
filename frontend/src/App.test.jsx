import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import App from "./App";

vi.mock(
  "@creit.tech/stellar-wallets-kit/sdk",
  () => ({
    StellarWalletsKit: {
      init: vi.fn(),
      setNetwork: vi.fn(),
      authModal: vi.fn(),
    },
  })
);

vi.mock(
  "@creit.tech/stellar-wallets-kit/modules/utils",
  () => ({
    defaultModules: vi.fn(() => []),
  })
);

vi.mock("./services/contracts", () => ({
  createTask: vi.fn(),

  completeTask: vi.fn(),

  getReputation: vi.fn(() =>
    Promise.resolve(0)
  ),

  getNextTaskId: vi.fn(() =>
    Promise.resolve(3)
  ),

  getTask: vi.fn((taskId) =>
    Promise.resolve({
      id: taskId,

      title:
        taskId === 1
          ? "Complete Level 3 TaskHub"
          : "Frontend Stellar Integration",

      creator:
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",

      completed: true,
    })
  ),
}));

vi.mock("./services/events", () => ({
  startEventPolling: vi.fn(
    ({ onEvents }) => {
      onEvents?.([], []);

      return () => {};
    }
  ),
}));

describe(
  "Stellar TaskHub frontend",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "renders the Stellar TaskHub interface",
      async () => {
        render(<App />);

        expect(
          screen.getByText(
            "Stellar TaskHub"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name: /connect wallet/i,
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "loads and displays on-chain tasks",
      async () => {
        render(<App />);

        await waitFor(() => {
          expect(
            screen.getByText(
              "Complete Level 3 TaskHub"
            )
          ).toBeInTheDocument();

          expect(
            screen.getByText(
              "Frontend Stellar Integration"
            )
          ).toBeInTheDocument();
        });
      }
    );

    it(
      "opens the new task form",
      async () => {
        render(<App />);

        const newTaskButton =
          screen.getByRole(
            "button",
            {
              name: /new task/i,
            }
          );

        fireEvent.click(
          newTaskButton
        );

        expect(
          screen.getByPlaceholderText(
            "What do you want to accomplish?"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name: /create on stellar/i,
            }
          )
        ).toBeInTheDocument();
      }
    );
  }
);