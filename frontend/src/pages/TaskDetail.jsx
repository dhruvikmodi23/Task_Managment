"use client"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "react-query"
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
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/authContext"

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
      pending: <Clock className="h-5 w-5 text-gray-500" />,
      "in-progress": <AlertCircle className="h-5 w-5 text-yellow-500" />,
      completed: <CheckCircle className="h-5 w-5 text-green-500" />,
      cancelled: <XCircle className="h-5 w-5 text-red-500" />,
    }
    return icons[status] || <Clock className="h-5 w-5 text-gray-500" />
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
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Task not found</h3>
        <p className="mt-1 text-sm text-gray-500">The task you're looking for doesn't exist or has been deleted.</p>
        <Link to="/tasks" className="mt-4 btn-primary inline-flex">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/tasks" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{taskData.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(taskData.status)}
              <span className={`badge ${getStatusBadge(taskData.status)}`}>{taskData.status.replace("-", " ")}</span>
              <span className={`badge ${getPriorityBadge(taskData.priority)}`}>{taskData.priority}</span>
            </div>
          </div>
        </div>
        {canEditTask(taskData) && (
          <div className="flex space-x-2">
            <Link to={`/tasks`} state={{ editTask: taskData }} className="btn-outline">
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
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">Description</h2>
            </div>
            <div className="card-content">
              <p className="text-gray-700 whitespace-pre-wrap">{taskData.description}</p>
            </div>
          </div>

          {/* Attachments */}
          {taskData.attachments && taskData.attachments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Attachments</h2>
                <p className="text-sm text-gray-500">{taskData.attachments.length} file(s) attached</p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {taskData.attachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                          <p className="text-xs text-gray-500">
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
                          className="text-primary-600 hover:text-primary-900"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {canEditTask(taskData) && (
                          <button
                            onClick={() => handleRemoveAttachment(attachment._id)}
                            className="text-red-600 hover:text-red-900"
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
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">Task Information</h2>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusIcon(taskData.status)}
                  <span className="text-sm text-gray-900 capitalize">{taskData.status.replace("-", " ")}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{taskData.priority}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{format(new Date(taskData.dueDate), "MMMM dd, yyyy")}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {taskData.assignedTo.firstName} {taskData.assignedTo.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{taskData.assignedTo.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {taskData.createdBy.firstName} {taskData.createdBy.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{taskData.createdBy.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{format(new Date(taskData.createdAt), "MMMM dd, yyyy")}</p>
              </div>

              {taskData.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(taskData.completedAt), "MMMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {canEditTask(taskData) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="card-content space-y-2">
                <Link to={`/tasks`} state={{ editTask: taskData }} className="btn-outline w-full">
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
                  className="btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
