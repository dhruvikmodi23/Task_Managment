"use client";

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    ...(user?.role === "admin"
      ? [{ name: "Users", href: "/users", icon: Users }]
      : []),
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex" style={{backgroundColor: "#0A122A"}}>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-40"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col shadow-xl" style={{backgroundColor: "#0A122A", borderRight: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <div className="flex h-16 items-center justify-between px-5" style={{borderBottom: "1px solid rgba(231, 222, 205, 0.2)"}}>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{backgroundColor: "rgba(231, 222, 205, 0.1)"}}>
                <Sparkles className="h-5 w-5" style={{ color: "#E7DECD" }} />
              </div>
              <h1 className="ml-3 text-xl font-bold" style={{color: "#E7DECD"}}>TaskFlow</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{color: "#E7DECD"}}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    "group flex items-center px-4 py-3 text-lg font-medium rounded-md transition-all",
                    isActive
                      ? "font-semibold border-l-4"
                      : "hover:opacity-80"
                  )}
                  style={{
                    backgroundColor: isActive ? "rgba(231, 222, 205, 0.1)" : "transparent",
                    color: "#E7DECD",
                    borderColor: isActive ? "#E7DECD" : "transparent"
                  }}
                >
                  <Icon className="mr-4 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-5" style={{borderTop: "1px solid rgba(231, 222, 205, 0.2)"}}>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-semibold" style={{backgroundColor: "#E7DECD", color: "#0A122A"}}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium" style={{color: "#E7DECD"}}>
                  {user?.fullName}
                </p>
                <p className="text-sm capitalize" style={{color: "rgba(231, 222, 205, 0.7)"}}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-medium rounded-md transition"
              style={{
                color: "#0A122A",
                backgroundColor: "#E7DECD",
                hover: {backgroundColor: "#D5C9B8"}
              }}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 shadow-sm" style={{backgroundColor: "#0A122A", borderRight: "1px solid rgba(231, 222, 205, 0.2)"}}>
        <div className="flex h-16 items-center px-6" style={{borderBottom: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{backgroundColor: "rgba(231, 222, 205, 0.1)"}}>
              <Sparkles className="h-5 w-5" style={{ color: "#E7DECD" }} />
            </div>
            <h1 className="ml-3 text-xl font-bold" style={{color: "#E7DECD"}}>TaskFlow</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  "group flex items-center px-4 py-3 text-lg font-medium rounded-md transition-all",
                  isActive
                    ? "font-semibold border-l-4"
                    : "hover:opacity-80"
                )}
                style={{
                  backgroundColor: isActive ? "rgba(231, 222, 205, 0.1)" : "transparent",
                  color: "#E7DECD",
                  borderColor: isActive ? "#E7DECD" : "transparent"
                }}
              >
                <Icon className="mr-4 h-6 w-6" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-5" style={{borderTop: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-semibold" style={{backgroundColor: "#E7DECD", color: "#0A122A"}}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="ml-3">
              <p className="text-lg font-medium" style={{color: "#E7DECD"}}>
                {user?.fullName}
              </p>
              <p className="text-sm capitalize" style={{color: "rgba(231, 222, 205, 0.7)"}}>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-medium rounded-md transition"
            style={{
              color: "#0A122A",
              backgroundColor: "#E7DECD",
              hover: {backgroundColor: "#D5C9B8"}
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shadow-sm items-center px-5 lg:px-8 justify-between" style={{backgroundColor: "#0A122A", borderBottom: "1px solid rgba(231, 222, 205, 0.2)"}}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden focus:outline-none"
            style={{color: "#E7DECD"}}
          >
            <Menu className="h-7 w-7" />
          </button>
          <h2 className="text-xl font-semibold" style={{color: "#E7DECD"}}>
            {navigation.find((item) => item.href === location.pathname)?.name ||
              "TaskFlow"}
          </h2>
          <span className="text-base" style={{color: "rgba(231, 222, 205, 0.7)"}}>
            Welcome, {user?.firstName} 👋
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1" style={{backgroundColor: "rgba(10, 18, 42, 0.95)"}}>
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;