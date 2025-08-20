"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { tasksAPI, usersAPI } from "../services/api";
import { useAuth } from "../contexts/authContext";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Trash2,
  Edit,
  Eye,
  Sparkles
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: [
      "tasks",
      {
        page,
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
      },
    ],
    queryFn: () =>
      tasksAPI.getTasks({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    select: (response) => response.data,
    placeholderData: (prev) => prev,
  });

  // Fetch users (admin only)
  const { data: usersData } = useQuery({
    queryKey: ["users", { limit: 100 }],
    queryFn: () => usersAPI.getUsers({ limit: 100 }),
    select: (response) => response.data.users,
    enabled: user?.role === "admin",
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowCreateModal(false);
      setSelectedFiles([]);
      reset();
      toast.success("Task created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create task");
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTask(null);
      setSelectedFiles([]);
      reset();
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update task");
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: tasksAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete task");
    },
  });

  const onSubmit = (data) => {
    const taskData = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString(),
      attachments: selectedFiles,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask._id, data: taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: format(new Date(task.dueDate), "yyyy-MM-dd"),
      assignedTo: task.assignedTo._id,
    });
    setShowCreateModal(true);
  };

  const handleDelete = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
    setSelectedFiles([]);
    reset();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length !== files.length) {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (pdfFiles.length > 3) {
      toast.error("Maximum 3 files allowed");
      return;
    }

    setSelectedFiles(pdfFiles);
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

  const canEditTask = (task) => {
    return user?.role === "admin" || task.assignedTo._id === user?._id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{color: "#E7DECD"}}>Tasks</h1>
          <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.8)"}}>Manage and track your tasks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#E7DECD",
            color: "#0A122A",
            hover: {backgroundColor: "#D5C9B8"}
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{color: "rgba(231, 222, 205, 0.5)"}} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 px-4 py-2 rounded-md border outline-none transition-all"
              style={{
                backgroundColor: "rgba(231, 222, 205, 0.05)",
                borderColor: "rgba(231, 222, 205, 0.2)",
                color: "#E7DECD",
                placeholder: {color: "rgba(231, 222, 205, 0.5)"},
                focus: {
                  borderColor: "#E7DECD",
                  boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                }
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-md border outline-none transition-all"
            style={{
              backgroundColor: "rgba(231, 222, 205, 0.05)",
              borderColor: "rgba(231, 222, 205, 0.2)",
              color: "#E7DECD",
              focus: {
                borderColor: "#E7DECD",
                boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
              }
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 rounded-md border outline-none transition-all"
            style={{
              backgroundColor: "rgba(231, 222, 205, 0.05)",
              borderColor: "rgba(231, 222, 205, 0.2)",
              color: "#E7DECD",
              focus: {
                borderColor: "#E7DECD",
                boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
              }
            }}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setPriorityFilter("");
            }}
            className="px-4 py-2 rounded-md border font-medium transition"
            style={{
              backgroundColor: "transparent",
              borderColor: "rgba(231, 222, 205, 0.2)",
              color: "#E7DECD",
              hover: {
                backgroundColor: "rgba(231, 222, 205, 0.1)"
              }
            }}
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="rounded-2xl p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasksData?.tasks?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12" style={{color: "rgba(231, 222, 205, 0.4)"}} />
            <h3 className="mt-2 text-lg font-medium" style={{color: "#E7DECD"}}>
              No tasks found
            </h3>
            <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.7)"}}>
              Get started by creating your first task.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasksData?.tasks?.map((task) => (
              <div
                key={task._id}
                className="rounded-lg p-4 transition-all"
                style={{
                  backgroundColor: "rgba(231, 222, 205, 0.05)",
                  border: "1px solid rgba(231, 222, 205, 0.2)",
                  hover: {
                    backgroundColor: "rgba(231, 222, 205, 0.1)"
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium" style={{color: "#E7DECD"}}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="mb-3" style={{color: "rgba(231, 222, 205, 0.8)"}}>{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                      </div>
                      <div>
                        Assigned to: {task.assignedTo.firstName}{" "}
                        {task.assignedTo.lastName}
                      </div>
                      {task.attachments?.length > 0 && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {task.attachments.length} attachment
                          {task.attachments.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/tasks/${task._id}`}
                      style={{color: "#E7DECD", hover: {color: "#D5C9B8"}}}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {canEditTask(task) && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          style={{color: "#E7DECD", hover: {color: "#D5C9B8"}}}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          style={{color: "#E76F51", hover: {color: "#D25B3F"}}}
                        >
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
            <div className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
              Showing {tasksData.tasks.length} of{" "}
              {tasksData.pagination.totalTasks} tasks
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!tasksData.pagination.hasPrev}
                className="px-3 py-1 rounded-md border font-medium transition disabled:opacity-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "rgba(231, 222, 205, 0.2)",
                  color: "#E7DECD",
                  hover: {
                    backgroundColor: "rgba(231, 222, 205, 0.1)"
                  }
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!tasksData.pagination.hasNext}
                className="px-3 py-1 rounded-md border font-medium transition disabled:opacity-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "rgba(231, 222, 205, 0.2)",
                  color: "#E7DECD",
                  hover: {
                    backgroundColor: "rgba(231, 222, 205, 0.1)"
                  }
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 w-full max-w-2xl shadow-lg rounded-md" style={{backgroundColor: "#0A122A", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{color: "#E7DECD"}}>
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  style={{color: "#E7DECD"}}
                >
                  <Sparkles className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                    Title
                  </label>
                  <input
                    {...register("title", {
                      required: "Title is required",
                      maxLength: 100,
                    })}
                    type="text"
                    className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                    placeholder="Enter task title"
                    style={{
                      backgroundColor: "rgba(231, 222, 205, 0.05)",
                      borderColor: "rgba(231, 222, 205, 0.2)",
                      color: "#E7DECD",
                      placeholder: {color: "rgba(231, 222, 205, 0.5)"},
                      focus: {
                        borderColor: "#E7DECD",
                        boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                      }
                    }}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                    Description
                  </label>
                  <textarea
                    {...register("description", {
                      required: "Description is required",
                      maxLength: 1000,
                    })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                    placeholder="Enter task description"
                    style={{
                      backgroundColor: "rgba(231, 222, 205, 0.05)",
                      borderColor: "rgba(231, 222, 205, 0.2)",
                      color: "#E7DECD",
                      placeholder: {color: "rgba(231, 222, 205, 0.5)"},
                      focus: {
                        borderColor: "#E7DECD",
                        boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                      }
                    }}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Status
                    </label>
                    <select
                      {...register("status", {
                        required: "Status is required",
                      })}
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      style={{
                        backgroundColor: "rgba(231, 222, 205, 0.05)",
                        borderColor: "rgba(231, 222, 205, 0.2)",
                        color: "#E7DECD",
                        focus: {
                          borderColor: "#E7DECD",
                          boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                        }
                      }}
                    >
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.status.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Priority
                    </label>
                    <select
                      {...register("priority", {
                        required: "Priority is required",
                      })}
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      style={{
                        backgroundColor: "rgba(231, 222, 205, 0.05)",
                        borderColor: "rgba(231, 222, 205, 0.2)",
                        color: "#E7DECD",
                        focus: {
                          borderColor: "#E7DECD",
                          boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                        }
                      }}
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.priority.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Due Date
                    </label>
                    <input
                      {...register("dueDate", {
                        required: "Due date is required",
                      })}
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      style={{
                        backgroundColor: "rgba(231, 222, 205, 0.05)",
                        borderColor: "rgba(231, 222, 205, 0.2)",
                        color: "#E7DECD",
                        focus: {
                          borderColor: "#E7DECD",
                          boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                        }
                      }}
                    />
                    {errors.dueDate && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.dueDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Assign To
                    </label>
                    <select
                      {...register("assignedTo", {
                        required: "Assignment is required",
                      })}
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      style={{
                        backgroundColor: "rgba(231, 222, 205, 0.05)",
                        borderColor: "rgba(231, 222, 205, 0.2)",
                        color: "#E7DECD",
                        focus: {
                          borderColor: "#E7DECD",
                          boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                        }
                      }}
                    >
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
                    {errors.assignedTo && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.assignedTo.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                    Attachments (PDF only, max 3)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                    style={{
                      backgroundColor: "rgba(231, 222, 205, 0.05)",
                      borderColor: "rgba(231, 222, 205, 0.2)",
                      color: "#E7DECD",
                      focus: {
                        borderColor: "#E7DECD",
                        boxShadow: "0 0 0 2px rgba(231, 222, 205, 0.3)"
                      }
                    }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm" style={{color: "rgba(231, 222, 205, 0.8)"}}>Selected files:</p>
                      <ul className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
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
                    disabled={
                      createTaskMutation.isLoading ||
                      updateTaskMutation.isLoading
                    }
                    className="flex-1 px-4 py-2 rounded-md font-medium transition"
                    style={{
                      backgroundColor: "#E7DECD",
                      color: "#0A122A",
                      hover: {backgroundColor: "#D5C9B8"},
                      disabled: {opacity: 0.7}
                    }}
                  >
                    {createTaskMutation.isLoading ||
                    updateTaskMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : editingTask ? (
                      "Update Task"
                    ) : (
                      "Create Task"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 rounded-md border font-medium transition"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "rgba(231, 222, 205, 0.2)",
                      color: "#E7DECD",
                      hover: {
                        backgroundColor: "rgba(231, 222, 205, 0.1)"
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;