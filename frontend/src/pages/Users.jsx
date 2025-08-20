"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { usersAPI } from "../services/api";
import { useAuth } from "../contexts/authContext";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Shield,
  X,
  Filter,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", { page, search: searchTerm, role: selectedRole }],
    queryFn: () =>
      usersAPI.getUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
      }),
    select: (response) => response.data,
    placeholderData: (prev) => prev,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: usersAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreateModal(false);
      reset();
      toast.success("User created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      reset();
      toast.success("User updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });

  const onSubmit = (data) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser._id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    setShowCreateModal(true);
  };

  const handleDelete = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    reset();
  };

  const getRoleBadge = (role) => {
    const badges = {
      user: "bg-blue-100 text-blue-800",
      admin: "bg-yellow-100 text-yellow-800",
    };
    return badges[role] || "bg-gray-100 text-gray-800";
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-8">
        <Shield className="mx-auto h-12 w-12" style={{color: "rgba(231, 222, 205, 0.4)"}} />
        <h3 className="mt-2 text-lg font-medium" style={{color: "#E7DECD"}}>Access Denied</h3>
        <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.7)"}}>
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{color: "#E7DECD"}}>Users</h1>
          <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.8)"}}>Manage system users and their permissions</p>
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
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{color: "rgba(231, 222, 205, 0.5)"}} />
            <input
              type="text"
              placeholder="Search users..."
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
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
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
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedRole("");
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

      {/* Users List */}
      <div className="rounded-2xl p-6" style={{backgroundColor: "rgba(231, 222, 205, 0.1)", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : usersData?.users?.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12" style={{color: "rgba(231, 222, 205, 0.4)"}} />
            <h3 className="mt-2 text-lg font-medium" style={{color: "#E7DECD"}}>
              No users found
            </h3>
            <p className="mt-1" style={{color: "rgba(231, 222, 205, 0.7)"}}>
              Get started by creating a new user.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {usersData?.users?.map((user) => (
              <div
                key={user._id}
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
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(231, 222, 205, 0.2)"}}>
                        <span className="text-sm font-medium" style={{color: "#E7DECD"}}>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium" style={{color: "#E7DECD"}}>
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm" style={{color: "rgba(231, 222, 205, 0.8)"}}>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div>
                        Joined: {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      style={{color: "#E7DECD", hover: {color: "#D5C9B8"}}}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {user._id !== currentUser._id && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        style={{color: "#E76F51", hover: {color: "#D25B3F"}}}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {usersData?.pagination && usersData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm" style={{color: "rgba(231, 222, 205, 0.7)"}}>
              Showing {usersData.users.length} of{" "}
              {usersData.pagination.totalUsers} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!usersData.pagination.hasPrev}
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
                disabled={!usersData.pagination.hasNext}
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

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 w-full max-w-2xl shadow-lg rounded-md" style={{backgroundColor: "#0A122A", border: "1px solid rgba(231, 222, 205, 0.2)"}}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{color: "#E7DECD"}}>
                  {editingUser ? "Edit User" : "Create New User"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  style={{color: "#E7DECD"}}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      First Name
                    </label>
                    <input
                      {...register("firstName", { required: "First name is required" })}
                      type="text"
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      placeholder="Enter first name"
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
                    {errors.firstName && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Last Name
                    </label>
                    <input
                      {...register("lastName", { required: "Last name is required" })}
                      type="text"
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      placeholder="Enter last name"
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
                    {errors.lastName && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                    Email
                  </label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                    })}
                    type="email"
                    className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                    placeholder="Enter email address"
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
                  {errors.email && (
                    <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                      Password
                    </label>
                    <input
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                      })}
                      type="password"
                      className="w-full px-3 py-2 rounded-md border outline-none transition-all mt-1"
                      placeholder="Enter password"
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
                    {errors.password && (
                      <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>
                    Role
                  </label>
                  <select
                    {...register("role", { required: "Role is required" })}
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
                    <option value="">Select role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                    className="flex-1 px-4 py-2 rounded-md font-medium transition"
                    style={{
                      backgroundColor: "#E7DECD",
                      color: "#0A122A",
                      hover: {backgroundColor: "#D5C9B8"},
                      disabled: {opacity: 0.7}
                    }}
                  >
                    {createUserMutation.isLoading || updateUserMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : editingUser ? (
                      "Update User"
                    ) : (
                      "Create User"
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

export default Users;