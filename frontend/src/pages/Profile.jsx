"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/authContext"
import { User, Mail, Calendar, Shield } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"


const Profile = () => {
  const { user, updateProfile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  })

  const onSubmit = async (data) => {
    const result = await updateProfile(data)
    if (result.success) {
      setIsEditing(false)
      reset(data)
    }
  }

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-outline">
                Edit Profile
              </button>
            )}
          </div>
        </div>
        <div className="card-content">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    {...register("firstName", {
                      required: "First name is required",
                      maxLength: {
                        value: 50,
                        message: "First name must be less than 50 characters",
                      },
                    })}
                    type="text"
                    className="input mt-1"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    {...register("lastName", {
                      required: "Last name is required",
                      maxLength: {
                        value: 50,
                        message: "Last name must be less than 50 characters",
                      },
                    })}
                    type="text"
                    className="input mt-1"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                  type="email"
                  className="input mt-1"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="flex space-x-3">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <LoadingSpinner size="sm" /> : "Save Changes"}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First name</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last name</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.lastName}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member since</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.createdAt && format(new Date(user.createdAt), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Statistics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Account Statistics</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">{user?.createdAt && format(new Date(user.createdAt), "MMM yyyy")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
