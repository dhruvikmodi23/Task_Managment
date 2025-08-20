"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useForm } from "react-hook-form"
import { tasksAPI, usersAPI } from "../services/api"
import { useAuth } from "../contexts/authContext"
import { Plus, Search, Filter, Calendar, FileText, Trash2, Edit, Eye } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"

const Tasks = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [page, setPage] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm()

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery(
    ["tasks", { page, search: searchTerm, status: statusFilter, priority: priorityFilter }],
    () =>
      tasksAPI.getTasks({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    },
  )

  // Fetch users for assignment (admin only)
  const { data: usersData } = useQuery(["users", { limit: 100 }], () => usersAPI.getUsers({ limit: 100 }), {
    select: (response) => response.data.users,
    enabled: user?.role === "admin",
  })

  // Create task mutation
  const createTaskMutation = useMutation(tasksAPI.createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries("tasks")
      setShowCreateModal(false)
      setSelectedFiles([])
      reset()
      toast.success("Task created successfully!")
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create task")
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation(({ id, data }) => tasksAPI.updateTask(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries("tasks")
      setEditingTask(null)
      setSelectedFiles([])
      reset()
      toast.success("Task updated successfully!")
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update task")
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation(tasksAPI.deleteTask, {
    onSuccess: () => {
      queryClient.invalidateQueries("tasks")
      toast.success("Task deleted successfully!")
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete task")
    },
  })

  const onSubmit = (data) => {
    const taskData = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString(),
      attachments: selectedFiles,
    }

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask._id, data: taskData })
    } else {
      createTaskMutation.mutate(taskData)
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
      assignedTo: task.assignedTo._id,
    })
    setShowCreateModal(true)
  }

  const handleDelete = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingTask(null)
    setSelectedFiles([])
    reset()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const pdfFiles = files.filter((file) => file.type === "application/pdf")

    if (pdfFiles.length !== files.length) {
      toast.error("Only PDF files are allowed")
      return
    }

    if (pdfFiles.length > 3) {
      toast.error("Maximum 3 files allowed")
      return
    }

    setSelectedFiles(pdfFiles)
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
    return user?.role === "admin" || task.assignedTo._id === user?._id
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
                setPriorityFilter("")
              }}
              className="btn-outline"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-content">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : tasksData?.tasks?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first task.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksData?.tasks?.map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace("-", " ")}</span>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </div>
                        <div>
                          Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </div>
                        {task.attachments?.length > 0 && (
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {task.attachments.length} attachment{task.attachments.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link to={`/tasks/${task._id}`} className="text-primary-600 hover:text-primary-900">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canEditTask(task) && (
                        <>
                          <button onClick={() => handleEdit(task)} className="text-primary-600 hover:text-primary-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(task._id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {tasksData?.pagination && tasksData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {tasksData.tasks.length} of {tasksData.pagination.totalTasks} tasks
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!tasksData.pagination.hasPrev}
                  className="btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!tasksData.pagination.hasNext}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    {...register("title", { required: "Title is required", maxLength: 100 })}
                    type="text"
                    className="input mt-1"
                    placeholder="Enter task title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register("description", { required: "Description is required", maxLength: 1000 })}
                    rows={3}
                    className="input mt-1"
                    placeholder="Enter task description"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select {...register("status", { required: "Status is required" })} className="input mt-1">
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select {...register("priority", { required: "Priority is required" })} className="input mt-1">
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      {...register("dueDate", { required: "Due date is required" })}
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="input mt-1"
                    />
                    {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <select {...register("assignedTo", { required: "Assignment is required" })} className="input mt-1">
                      <option value="">Select user</option>
                      {user?.role === "admin" ? (
                        usersData?.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))
                      ) : (
                        <option value={user?._id}>
                          {user?.firstName} {user?.lastName} (You)
                        </option>
                      )}
                    </select>
                    {errors.assignedTo && <p className="mt-1 text-sm text-red-600">{errors.assignedTo.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachments (PDF only, max 3)</label>
                  <input type="file" multiple accept=".pdf" onChange={handleFileChange} className="input mt-1" />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected files:</p>
                      <ul className="text-sm text-gray-500">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>• {file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createTaskMutation.isLoading || updateTaskMutation.isLoading}
                    className="btn-primary flex-1"
                  >
                    {createTaskMutation.isLoading || updateTaskMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : editingTask ? (
                      "Update Task"
                    ) : (
                      "Create Task"
                    )}
                  </button>
                  <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
