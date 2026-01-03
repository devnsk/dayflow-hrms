import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dayflow HRMS API",
      version: "1.0.0",
      description: `
## Dayflow - Human Resource Management System API

A comprehensive, production-ready HRMS API designed for companies of any size.

### Features
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Employee Management** - Full employee lifecycle management
- **Attendance Tracking** - Check-in/check-out, shifts, corrections
- **Leave Management** - Leave types, balances, approvals
- **Payroll** - Salary structures, monthly payroll generation
- **Reports & Analytics** - Comprehensive reporting

### Authentication
All protected endpoints require a Bearer token:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### User Roles
- **SUPER_ADMIN** - Platform administrator
- **COMPANY_ADMIN** - Company HR/Admin
- **MANAGER** - Team manager
- **EMPLOYEE** - Regular employee
      `,
      contact: {
        name: "API Support",
        email: "support@dayflow.io",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1",
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
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
            hasNext: { type: "boolean", example: true },
            hasPrev: { type: "boolean", example: false },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "You are not authorized to access this resource",
              },
            },
          },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "You do not have permission to perform this action",
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "Requested resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                error: "Validation error",
                errors: [{ field: "email", message: "Invalid email address" }],
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & authorization" },
      { name: "Company", description: "Company & organization management" },
      { name: "Employees", description: "Employee management" },
      { name: "Attendance", description: "Attendance & time tracking" },
      { name: "Leave", description: "Leave management" },
      { name: "Payroll", description: "Payroll management" },
      { name: "Notifications", description: "Notifications" },
      { name: "Reports", description: "Reports & analytics" },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
