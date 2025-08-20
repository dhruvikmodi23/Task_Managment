"use client"

import { useQuery } from "@tanstack/react-query"
import { tasksAPI } from "../services/api"
import { useAuth } from "../contexts/authContext"
import { CheckSquare, Clock, TrendingUp } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"

const Dashboard = () => {
  const { user } = useAuth()

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", { limit: 10 }],
    queryFn: () => tasksAPI.getTasks({ limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
    select: (response) => response.data,
  })

  const tasks = tasksData?.tasks || []

  // Calculate statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge-secondary",
      "in-progress": "badge-warning",
      completed: "badge-success",
      cancelled: "badge-danger",
    }
    return badges[status] || "badge-secondary"
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: "badge-secondary",
      medium: "badge-warning",
      high: "badge-danger",
      urgent: "badge-danger",
    }
    return badges[priority] || "badge-secondary"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your tasks today.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
          <p className="text-sm text-gray-500">Your latest task assignments</p>
        </div>
        <div className="card-content">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first task.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace("-", " ")}</span>
                      <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                      <span className="text-xs text-gray-500">
                        Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {task.assignedTo && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{task.assignedTo.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
