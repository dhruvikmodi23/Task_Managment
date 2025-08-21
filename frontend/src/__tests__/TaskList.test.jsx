import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TaskList from "../components/TaskList";
import { vi } from "vitest";
import { tasksAPI } from "../services/api"; // ✅ ESM import

// Mock the API
vi.mock("../services/api", () => ({
  tasksAPI: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const renderWithClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("TaskList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tasks correctly", async () => {
    tasksAPI.getTasks.mockResolvedValueOnce([
      { _id: "1", title: "Test Task 1" },
      { _id: "2", title: "Test Task 2" },
    ]);

    renderWithClient(<TaskList />);

    expect(await screen.findByText("Test Task 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Task 2")).toBeInTheDocument();
  });

  it("shows no tasks message when empty", async () => {
    tasksAPI.getTasks.mockResolvedValueOnce([]);

    renderWithClient(<TaskList />);

    expect(await screen.findByText(/no tasks found/i)).toBeInTheDocument();
  });

  it("handles error state", async () => {
    tasksAPI.getTasks.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderWithClient(<TaskList />);

    expect(await screen.findByText(/failed to fetch/i)).toBeInTheDocument();
  });
});
