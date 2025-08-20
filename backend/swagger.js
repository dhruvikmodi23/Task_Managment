const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management System API",
      version: "1.0.0",
      description: "A comprehensive task management system with user authentication and file attachments",
      contact: {
        name: "API Support",
        email: "support@taskmanager.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
      {
        url: "https://your-production-url.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            firstName: {
              type: "string",
              maxLength: 50,
              description: "User first name",
            },
            lastName: {
              type: "string",
              maxLength: 50,
              description: "User last name",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
            },
            isActive: {
              type: "boolean",
              description: "User active status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update date",
            },
          },
        },
        Task: {
          type: "object",
          required: ["title", "description", "priority", "dueDate", "assignedTo"],
          properties: {
            _id: {
              type: "string",
              description: "Task ID",
            },
            title: {
              type: "string",
              maxLength: 100,
              description: "Task title",
            },
            description: {
              type: "string",
              maxLength: 1000,
              description: "Task description",
            },
            status: {
              type: "string",
              enum: ["pending", "in-progress", "completed", "cancelled"],
              description: "Task status",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Task priority",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "Task due date",
            },
            assignedTo: {
              $ref: "#/components/schemas/User",
            },
            createdBy: {
              $ref: "#/components/schemas/User",
            },
            attachments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Attachment",
              },
            },
            completedAt: {
              type: "string",
              format: "date-time",
              description: "Task completion date",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Task creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Task last update date",
            },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Attachment ID",
            },
            filename: {
              type: "string",
              description: "File name on server",
            },
            originalName: {
              type: "string",
              description: "Original file name",
            },
            mimetype: {
              type: "string",
              description: "File MIME type",
            },
            size: {
              type: "number",
              description: "File size in bytes",
            },
            uploadedAt: {
              type: "string",
              format: "date-time",
              description: "File upload date",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API files
}

const specs = swaggerJsdoc(options)

module.exports = {
  swaggerUi,
  specs,
}
