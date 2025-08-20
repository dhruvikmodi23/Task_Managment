"use client"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksAPI } from "../services/api"
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Download,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Plus
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/authContext"

// Design system variables (same as tasks page)
const colors = {
  primary: {
    dark: "#0A122A",
    light: "#E7DECD",
    accent: "#E76F51",
    muted: "rgba(231, 222, 205, 0.7)",
    subtle: "rgba(231, 222, 205, 0.1)",
    border: "rgba(231, 222, 205, 0.2)"
  },
  status: {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    "in-progress": { bg: "#BFDBFE", text: "#1E40AF" },
    completed: { bg: "#D1FAE5", text: "#065F46" },
    cancelled: { bg: "#FECACA", text: "#991B1B" }
  },
  priority: {
    low: { bg: "#F3F4F6", text: "#374151" },
    medium: { bg: "#FEF3C7", text: "#92400E" },
    high: { bg: "#FEE2E2", text: "#991B1B" },
    urgent: { bg: "#FECACA", text: "#7F1D1D", border: "#F87171" }
  }
};

// Common UI Components
const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const baseClasses = "flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2";
  
  const variants = {
    primary: "bg-primary-light text-primary-dark hover:bg-opacity-90 focus:ring-primary-light",
    secondary: "bg-transparent border border-primary-border text-primary-light hover:bg-primary-subtle focus:ring-primary-light",
    danger: "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500",
    ghost: "bg-transparent text-primary-light hover:bg-primary-subtle focus:ring-primary-light"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`rounded-xl bg-primary-subtle border border-primary-border p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const Badge = ({ children, style, className = "" }) => {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

const TaskDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch task details
  const {
    data: taskData,
    isLoading,
    error,
  } = useQuery(["task", id], () => tasksAPI.getTask(id), {
    select: (response) => response.data.task,
    onError: (error) => {
      if (error.response?.status === 404) {
        toast.error("Task not found")
        navigate("/tasks")
      }
    },
  })

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation(
    ({ taskId, attachmentId }) => tasksAPI.removeAttachment(taskId, attachmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["task", id])
        toast.success("Attachment removed successfully!")
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to remove attachment")
      },
    },
  )

  const handleDownloadAttachment = async (taskId, attachmentId, filename) => {
    try {
      const response = await tasksAPI.downloadAttachment(taskId, attachmentId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error("Failed to download attachment")
    }
  }

  const handleRemoveAttachment = (attachmentId) => {
    if (window.confirm("Are you sure you want to remove this attachment?")) {
      deleteAttachmentMutation.mutate({ taskId: id, attachmentId })
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-5 w-5" style={{color: colors.status.pending.text}} />,
      "in-progress": <AlertCircle className="h-5 w-5" style={{color: colors.status["in-progress"].text}} />,
      completed: <CheckCircle className="h-5 w-5" style={{color: colors.status.completed.text}} />,
      cancelled: <XCircle className="h-5 w-5" style={{color: colors.status.cancelled.text}} />,
    }
    return icons[status] || <Clock className="h-5 w-5 text-gray-500" />
  }

  const getStatusBadge = (status) => {
    return {
      backgroundColor: colors.status[status]?.bg || colors.status.pending.bg,
      color: colors.status[status]?.text || colors.status.pending.text
    };
  };

  const getPriorityBadge = (priority) => {
    return {
      backgroundColor: colors.priority[priority]?.bg || colors.priority.low.bg,
      color: colors.priority[priority]?.text || colors.priority.low.text
    };
  };

  const canEditTask = (task) => {
    return user?.role === "admin" || task?.assignedTo?._id === user?._id
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !taskData) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12" style={{color: "rgba(231, 222, 205, 0.4)"}} />
        <h3 className="mt-2 text-lg font-medium" style={{color: "#E7DECD"}}>Task not found</h3>
        <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.7)"}}>
          The task you're looking for doesn't exist or has been deleted.
        </p>
        <Link 
          to="/tasks" 
          className="mt-4 inline-flex items-center px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#E7DECD",
            color: "#0A122A",
            hover: {backgroundColor: "#D5C9B8"}
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/tasks" 
            className="transition-colors"
            style={{color: "rgba(231, 222, 205, 0.7)", hover: {color: "#E7DECD"}}}
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{color: "#E7DECD"}}>{taskData.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(taskData.status)}
              <Badge style={getStatusBadge(taskData.status)}>
                {taskData.status.replace("-", " ")}
              </Badge>
              <Badge style={getPriorityBadge(taskData.priority)}>
                {taskData.priority}
              </Badge>
            </div>
          </div>
        </div>
        {canEditTask(taskData) && (
          <div className="flex space-x-2">
            <Link 
              to={`/tasks`} 
              state={{ editTask: taskData }} 
              className="flex items-center px-4 py-2 rounded-md border font-medium transition"
              style={{
                backgroundColor: "transparent",
                borderColor: "rgba(231, 222, 205, 0.2)",
                color: "#E7DECD",
                hover: {
                  backgroundColor: "rgba(231, 222, 205, 0.1)"
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Link>
          </div>
        )}
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h2 className="text-lg font-medium mb-4" style={{color: "#E7DECD"}}>Description</h2>
            <p className="whitespace-pre-wrap" style={{color: "rgba(231, 222, 205, 0.8)"}}>
              {taskData.description}
            </p>
          </Card>

          {/* Attachments */}
          {taskData.attachments && taskData.attachments.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium" style={{color: "#E7DECD"}}>Attachments</h2>
                  <p className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
                    {taskData.attachments.length} file(s) attached
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {taskData.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      backgroundColor: "rgba(231, 222, 205, 0.05)",
                      borderColor: "rgba(231, 222, 205, 0.2)"
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8" style={{color: "#E76F51"}} />
                      <div>
                        <p className="text-sm font-medium" style={{color: "#E7DECD"}}>
                          {attachment.originalName}
                        </p>
                        <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {format(new Date(attachment.uploadedAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleDownloadAttachment(taskData._id, attachment._id, attachment.originalName)
                        }
                        className="transition-colors"
                        style={{color: "#E7DECD", hover: {color: "#D5C9B8"}}}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {canEditTask(taskData) && (
                        <button
                          onClick={() => handleRemoveAttachment(attachment._id)}
                          className="transition-colors"
                          style={{color: "#E76F51", hover: {color: "#D25B3F"}}}
                          title="Remove"
                          disabled={deleteAttachmentMutation.isLoading}
                        >
                          {deleteAttachmentMutation.isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <h2 className="text-lg font-medium mb-4" style={{color: "#E7DECD"}}>Task Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Status</label>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusIcon(taskData.status)}
                  <span className="text-sm capitalize" style={{color: "#E7DECD"}}>
                    {taskData.status.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Priority</label>
                <p className="mt-1 text-sm capitalize" style={{color: "#E7DECD"}}>{taskData.priority}</p>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Due Date</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" style={{color: "rgba(231, 222, 205, 0.7)"}} />
                  <span className="text-sm" style={{color: "#E7DECD"}}>
                    {format(new Date(taskData.dueDate), "MMMM dd, yyyy")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Assigned To</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4" style={{color: "rgba(231, 222, 205, 0.7)"}} />
                  <div>
                    <p className="text-sm" style={{color: "#E7DECD"}}>
                      {taskData.assignedTo.firstName} {taskData.assignedTo.lastName}
                    </p>
                    <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>{taskData.assignedTo.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Created By</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4" style={{color: "rgba(231, 222, 205, 0.7)"}} />
                  <div>
                    <p className="text-sm" style={{color: "#E7DECD"}}>
                      {taskData.createdBy.firstName} {taskData.createdBy.lastName}
                    </p>
                    <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>{taskData.createdBy.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Created</label>
                <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>
                  {format(new Date(taskData.createdAt), "MMMM dd, yyyy")}
                </p>
              </div>

              {taskData.completedAt && (
                <div>
                  <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Completed</label>
                  <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>
                    {format(new Date(taskData.completedAt), "MMMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          {canEditTask(taskData) && (
            <Card>
              <h2 className="text-lg font-medium mb-4" style={{color: "#E7DECD"}}>Quick Actions</h2>
              <div className="space-y-2">
                <Link 
                  to={`/tasks`} 
                  state={{ editTask: taskData }} 
                  className="flex items-center justify-center w-full px-4 py-2 rounded-md border font-medium transition"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "rgba(231, 222, 205, 0.2)",
                    color: "#E7DECD",
                    hover: {
                      backgroundColor: "rgba(231, 222, 205, 0.1)"
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      // Handle delete task
                      navigate("/tasks")
                    }
                  }}
                  className="flex items-center justify-center w-full px-4 py-2 rounded-md border font-medium transition"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "rgba(231, 222, 205, 0.2)",
                    color: "#E76F51",
                    hover: {
                      backgroundColor: "rgba(231, 111, 81, 0.1)"
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetail