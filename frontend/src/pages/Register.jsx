"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/authContext"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch("password")

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data
    const result = await registerUser(userData)
    if (result.success) {
      navigate("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                  placeholder="John"
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
                  placeholder="Doe"
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
                placeholder="john.doe@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
                type="password"
                className="input mt-1"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
