const request = require("supertest");
const app = require("../server");
const User = require("../models/User.model");

describe("Authentication Endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    const validUser = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register a new user successfully", async () => {
      const response = await request(app).post("/api/auth/register").send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 for invalid email", async () => {
      const invalidUser = { ...validUser, email: "invalid-email" };
      const response = await request(app).post("/api/auth/register").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 400 for short password", async () => {
      const invalidUser = { ...validUser, password: "123" };
      const response = await request(app).post("/api/auth/register").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/api/auth/register").send(validUser);
      const response = await request(app).post("/api/auth/register").send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(userData);
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(userData.email);
    });

    it("should return 401 for invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "wrong@example.com",
        password: userData.password,
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 401 for invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: userData.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/profile", () => {
    let token;
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    beforeEach(async () => {
      const response = await request(app).post("/api/auth/register").send(userData);
      token = response.body.token;
    });

    it("should get user profile with valid token", async () => {
      const response = await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(userData.email);
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/profile");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Access token required");
    });

    it("should return 403 with invalid token", async () => {
      const response = await request(app).get("/api/auth/profile").set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid token");
    });
  });
});