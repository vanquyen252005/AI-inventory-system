// src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "API xác thực người dùng (Login, Register, Token Management)",
    },
    servers: [
      { 
        url: "http://localhost:4000", 
        description: "Auth Server (Local)" 
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
    },
  },
  apis: ["./src/routes/*.js"], // Đường dẫn tới file chứa docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;