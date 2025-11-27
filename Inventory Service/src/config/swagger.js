// src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Service API",
      version: "1.0.0",
      description: "API quản lý tài sản và báo cáo",
    },
    servers: [
      { url: "http://localhost:4000/api/v1", description: "V1 Server" }, // Chỉnh port theo env của bạn
      { url: "http://localhost:4000/api/v2", description: "V2 Server" },
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
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // Đường dẫn tới các file chứa docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;