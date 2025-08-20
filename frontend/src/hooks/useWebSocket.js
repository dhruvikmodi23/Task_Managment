"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "../contexts/authContext"


export const useWebSocket = () => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000")

      socketRef.current.on("connect", () => {
        setIsConnected(true)
        socketRef.current.emit("join", user.id)
      })

      socketRef.current.on("disconnect", () => {
        setIsConnected(false)
      })

      // Listen for task updates
      socketRef.current.on("taskUpdate", (data) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "task_update",
            message: `Task "${data.task.title}" has been ${data.action}`,
            timestamp: data.timestamp,
          },
        ])
      })

      // Listen for task assignments
      socketRef.current.on("taskAssigned", (data) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "task_assigned",
            message: data.message,
            timestamp: data.timestamp,
          },
        ])
      })

      // Listen for system notifications
      socketRef.current.on("systemNotification", (data) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: data.type,
            message: data.message,
            timestamp: data.timestamp,
          },
        ])
      })

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
        }
      }
    }
  }, [user])

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    isConnected,
    notifications,
    clearNotification,
    clearAllNotifications,
  }
}
