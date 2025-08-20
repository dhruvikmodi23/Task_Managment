"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/authContext";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #0A122A 0%, #1E2A4A 50%, #0A122A 100%)",
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"
          style={{ backgroundColor: "#1E2A4A" }}
        ></div>
        <div
          className="absolute top-40 -right-40 w-80 h-80 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"
          style={{ backgroundColor: "#2A3A5F" }}
        ></div>
        <div
          className="absolute -bottom-40 left-40 w-80 h-80 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"
          style={{ backgroundColor: "#14213D" }}
        ></div>
      </div>

      {/* Left Panel - Illustration */}
      <div
        className="hidden lg:flex flex-col justify-center items-center w-1/2 px-12"
        style={{ color: "#E7DECD" }}
      >
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl backdrop-blur-sm"
              style={{ backgroundColor: "rgba(231, 222, 205, 0.1)" }}
            >
              <Sparkles className="h-7 w-7" style={{ color: "#E7DECD" }} />
            </div>
            <h1
              className="ml-4 text-3xl font-bold"
              style={{
                color: "#E7DECD",
              }}
            >
              TaskFlow
            </h1>
          </div>
          <h2 className="text-4xl font-bold mb-6" style={{ color: "#E7DECD" }}>
            Welcome Back!
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: "rgba(231, 222, 205, 0.8)" }}
          >
            Streamline your workflow and boost productivity with our intuitive
            task management system.
          </p>
          <div
            className="flex space-x-4 p-4 rounded-xl backdrop-blur-sm"
            style={{ backgroundColor: "rgba(231, 222, 205, 0.1)" }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(231, 222, 205, 0.15)" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#E7DECD" }}
              ></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold" style={{ color: "#E7DECD" }}>
                Collaborate with your team
              </h3>
              <p
                className="text-sm"
                style={{ color: "rgba(231, 222, 205, 0.7)" }}
              >
                Manage projects together in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className="rounded-3xl shadow-2xl p-8 space-y-6"
            style={{
              backgroundColor: "rgba(10, 18, 42, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(231, 222, 205, 0.2)",
            }}
          >
            {/* Logo for mobile */}
            <div className="flex lg:hidden items-center justify-center mb-6">
              <div className="flex items-center">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl backdrop-blur-sm"
                  style={{ backgroundColor: "rgba(231, 222, 205, 0.1)" }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: "#E7DECD" }} />
                </div>
                <h1
                  className="ml-3 text-xl font-bold"
                  style={{ color: "#E7DECD" }}
                >
                  TaskFlow
                </h1>
              </div>
            </div>

            {/* Form Header */}
            <div className="flex flex-col items-center">
              <div
                className="h-14 w-14 flex items-center justify-center rounded-full shadow-lg"
                style={{
                  backgroundColor: "#E7DECD",
                }}
              >
                <LogIn className="h-7 w-7" style={{ color: "#0A122A" }} />
              </div>
              <h2
                className="mt-4 text-2xl font-bold"
                style={{ color: "#E7DECD" }}
              >
                Sign in to your account
              </h2>
              <p
                className="mt-2 text-base"
                style={{ color: "rgba(231, 222, 205, 0.8)" }}
              >
                Or{" "}
                <Link
                  to="/register"
                  className="font-semibold transition-colors"
                  style={{ color: "#E7DECD" }}
                >
                  create a new account
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  className="block text-base font-medium"
                  style={{ color: "#E7DECD" }}
                >
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
                  placeholder="Enter your email"
                  className="mt-2 block w-full rounded-xl px-4 py-3 text-base shadow-sm outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(231, 222, 205, 0.05)",
                    border: "1px solid rgba(231, 222, 205, 0.2)",
                    color: "#E7DECD",
                    placeholder: { color: "rgba(231, 222, 205, 0.5)" },
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-sm" style={{ color: "#FCA5A5" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-base font-medium"
                  style={{ color: "#E7DECD" }}
                >
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="block w-full rounded-xl px-4 py-3 pr-10 text-base shadow-sm outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(231, 222, 205, 0.05)",
                      border: "1px solid rgba(231, 222, 205, 0.2)",
                      color: "#E7DECD",
                      placeholder: { color: "rgba(231, 222, 205, 0.5)" },
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                    style={{
                      color: "rgba(231, 222, 205, 0.5)",
                      hover: { color: "#E7DECD" },
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm" style={{ color: "#FCA5A5" }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none"
                style={{
                  backgroundColor: "#E7DECD",
                  color: "#0A122A",
                  hover: { backgroundColor: "#D5C9B8" },
                }}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Sign in"}
              </button>
            </form>
          </div>

          {/* Demo credentials card */}
          <div
            className="mt-6 rounded-2xl p-5 shadow-lg"
            style={{
              backgroundColor: "rgba(10, 18, 42, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(231, 222, 205, 0.2)",
            }}
          >
            <h3
              className="text-base font-semibold text-center mb-3"
              style={{ color: "#E7DECD" }}
            >
              Demo Credentials
            </h3>
            <div
              className="text-sm space-y-2"
              style={{ color: "rgba(231, 222, 205, 0.8)" }}
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: "#E7DECD" }}
                ></div>
                <p>
                  <span className="font-semibold">Admin:</span>{" "}
                  admin@taskmanager.com / admin123
                </p>
              </div>
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: "#E7DECD" }}
                ></div>
                <p>
                  <span className="font-semibold">User:</span>{" "}
                  john.doe@example.com / password123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        input:focus {
          border-color: #E7DECD;
          box-shadow: 0 0 0 2px rgba(231, 222, 205, 0.3);
        }
        input::placeholder {
          color: rgba(231, 222, 205, 0.5);
        }
        a:hover {
          color: #D5C9B8;
        }
        button:hover {
          background-color: #D5C9B8;
        }
        .eye-button:hover {
          color: #E7DECD;
        }
      `}</style>
    </div>
  );
};

export default Login;
