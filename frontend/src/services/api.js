import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)


export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
}


export const usersAPI = {
  getUsers: (params) => api.get("/users", { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post("/users", userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
}


export const tasksAPI = {
  getTasks: (params) => api.get("/tasks", { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => {
    const formData = new FormData()

    
    Object.keys(taskData).forEach((key) => {
      if (key !== "attachments") {
        formData.append(key, taskData[key])
      }
    })

    
    if (taskData.attachments) {
      taskData.attachments.forEach((file) => {
        formData.append("attachments", file)
      })
    }

    return api.post("/tasks", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  updateTask: (id, taskData) => {
    const formData = new FormData()

    
    Object.keys(taskData).forEach((key) => {
      if (key !== "attachments") {
        formData.append(key, taskData[key])
      }
    })

    
    if (taskData.attachments) {
      taskData.attachments.forEach((file) => {
        formData.append("attachments", file)
      })
    }

    return api.put(`/tasks/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  downloadAttachment: (taskId, attachmentId) =>
    api.get(`/tasks/${taskId}/attachments/${attachmentId}`, {
      responseType: "blob",
    }),
  removeAttachment: (taskId, attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
}

export default api
