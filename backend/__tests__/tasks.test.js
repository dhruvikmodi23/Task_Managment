const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../server");
const User = require("../models/User.model");
const Task = require("../models/Task.model");

describe("Task Endpoints", () => {
  let adminToken, userToken, adminUser, regularUser;

  beforeEach(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});

    console.log("Creating admin user...");
    // Create admin user directly in the database to ensure proper role
    adminUser = await User.create({
      email: "admin@test.com",
      password: "password123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
    console.log("Admin user created:", adminUser);

    console.log("Creating regular user...");
    // Create regular user directly in the database
    regularUser = await User.create({
      email: "user@test.com",
      password: "password123",
      firstName: "Regular",
      lastName: "User",
      role: "user",
    });
    console.log("Regular user created:", regularUser);

    console.log("Logging in admin...");
    // Login to get tokens
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });
    adminToken = adminLogin.body.token;
    console.log("Admin login response:", adminLogin.status, adminLogin.body);

    console.log("Logging in user...");
    const userLogin = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "password123",
    });
    userToken = userLogin.body.token;
    console.log("User login response:", userLogin.status, userLogin.body);
  });

  describe("POST /api/tasks", () => {
    const validTask = {
      title: "Test Task",
      description: "Test task description",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: null, // Will be set in tests
    };

    it("should create a task successfully", async () => {
      const taskData = { 
        ...validTask, 
        assignedTo: regularUser._id.toString() 
      };
      
      console.log("Admin Token:", adminToken);
      console.log("Task Data:", taskData);
      
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(taskData);

      console.log("Response Status:", response.status);
      console.log("Response Body:", response.body);
      console.log("Response Headers:", response.headers);

      // Check if it's a 403 Forbidden error
      if (response.status === 403) {
        console.log("403 Error - Checking user permissions...");
        // Let's verify the admin user actually has admin role
        const currentAdmin = await User.findById(adminUser._id);
        console.log("Current admin user from DB:", currentAdmin);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("task");
      expect(response.body.task.title).toBe(taskData.title);
    });

    it("should return 400 for invalid task data", async () => {
      const invalidTask = { title: "" }; // Missing required fields
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidTask);

      console.log("Invalid task response:", response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 401 without authentication", async () => {
      const taskData = { 
        ...validTask, 
        assignedTo: regularUser._id.toString() 
      };
      const response = await request(app).post("/api/tasks").send(taskData);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/tasks", () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create({
        title: "Task 1",
        description: "Description 1",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
      });

      await Task.create({
        title: "Task 2",
        description: "Description 2",
        status: "completed",
        priority: "low",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
      });
    });

    it("should get all tasks for admin", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`);

      console.log("GET Tasks Response:", response.body); // Debug

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("tasks");
      expect(response.body.tasks.length).toBe(2);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should get only assigned tasks for regular user", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.length).toBe(2);
    });

    it("should filter tasks by status", async () => {
      const response = await request(app)
        .get("/api/tasks?status=pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.length).toBe(1);
      expect(response.body.tasks[0].status).toBe("pending");
    });

    it("should search tasks by title", async () => {
      const response = await request(app)
        .get("/api/tasks?search=Task 1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.length).toBe(1);
      expect(response.body.tasks[0].title).toBe("Task 1");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: "Original Task",
        description: "Original description",
        status: "pending",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
      });
      taskId = task._id.toString();
    });

    it("should update task successfully", async () => {
      const updateData = {
        title: "Updated Task",
        status: "in-progress",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.status).toBe(updateData.status);
    });

    it("should allow assigned user to update their task", async () => {
      const updateData = { status: "completed" };
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe("completed");
    });

    it("should return 404 for non-existent task", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: "Task to Delete",
        description: "Description",
        status: "pending",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
      });
      taskId = task._id.toString();
    });

    it("should delete task successfully", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Task deleted successfully");

      // Verify task is deleted
      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });

    it("should allow assigned user to delete their task", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    it("should return 404 for non-existent task", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});