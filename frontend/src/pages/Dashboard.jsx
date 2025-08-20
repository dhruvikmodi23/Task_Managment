"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksAPI } from "../services/api";
import { useAuth } from "../contexts/authContext";
import { CheckSquare, Clock, TrendingUp } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", { limit: 10 }],
    queryFn: () =>
      tasksAPI.getTasks({ limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
    select: (response) => response.data,
  });

  const tasks = tasksData?.tasks || [];

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
      urgent: "bg-red-200 text-red-900 font-semibold",
    };
    return badges[priority] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl shadow p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        <h1 className="text-3xl font-bold" style={{color: "#E7DECD"}}>
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-lg mt-2" style={{color: "rgba(231, 222, 205, 0.8)"}}>
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="shadow rounded-2xl p-6 flex items-center" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <CheckSquare className="h-10 w-10" style={{color: "#E7DECD"}} />
          <div className="ml-4">
            <p className="text-lg font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Total Tasks</p>
            <p className="text-3xl font-bold" style={{color: "#E7DECD"}}>{stats.total}</p>
          </div>
        </div>

        <div className="shadow rounded-2xl p-6 flex items-center" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <Clock className="h-10 w-10" style={{color: "#E7DECD"}} />
          <div className="ml-4">
            <p className="text-lg font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Pending</p>
            <p className="text-3xl font-bold" style={{color: "#E7DECD"}}>{stats.pending}</p>
          </div>
        </div>

        <div className="shadow rounded-2xl p-6 flex items-center" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <TrendingUp className="h-10 w-10" style={{color: "#E7DECD"}} />
          <div className="ml-4">
            <p className="text-lg font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>In Progress</p>
            <p className="text-3xl font-bold" style={{color: "#E7DECD"}}>{stats.inProgress}</p>
          </div>
        </div>

        <div className="shadow rounded-2xl p-6 flex items-center" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <CheckSquare className="h-10 w-10" style={{color: "#E7DECD"}} />
          <div className="ml-4">
            <p className="text-lg font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Completed</p>
            <p className="text-3xl font-bold" style={{color: "#E7DECD"}}>{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="shadow rounded-2xl p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        <h2 className="text-2xl font-bold mb-6" style={{color: "#E7DECD"}}>Recent Tasks</h2>
        <p className="mb-6" style={{color: "rgba(231, 222, 205, 0.8)"}}>Your latest task updates</p>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12" style={{color: "rgba(231, 222, 205, 0.4)"}} />
            <h3 className="mt-4 text-lg font-medium" style={{color: "#E7DECD"}}>No tasks yet</h3>
            <p className="mt-2" style={{color: "rgba(231, 222, 205, 0.7)"}}>Get started by creating your first task.</p>
          </div>
        ) : (
          <div className="divide-y" style={{dividerColor: "rgba(231, 222, 205, 0.2)"}}>
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task._id}
                className="py-4 flex justify-between items-center hover:bg-opacity-5 px-2 rounded-lg transition"
                style={{hoverBackgroundColor: "rgba(231, 222, 205, 0.05)"}}
              >
                <div>
                  <h4 className="text-lg font-semibold" style={{color: "#E7DECD"}}>{task.title}</h4>
                  <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.8)"}}>{task.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status.replace("-", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
                      Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
                {task.assignedTo && (
                  <div className="text-right">
                    <p className="text-md font-medium" style={{color: "#E7DECD"}}>
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </p>
                    <p className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>{task.assignedTo.email}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;