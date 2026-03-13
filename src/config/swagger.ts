import swaggerJsdoc  from "swagger-jsdoc";
import swaggerUi     from "swagger-ui-express";
import { Express }   from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title:       "DineFlow API",
      version:     "2.0.0",
      description: "Restaurant Management System REST API",
      contact: {
        name:  "Suraj Mane",
        email: "suraj@dineflow.com",
      },
    },
    servers: [
      { url: "http://localhost:5000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         "http",
          scheme:       "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── Auth ────────────────────────────────────────────────────────
        RegisterInput: {
          type: "object",
          required: ["firstName", "lastName", "email", "password", "role"],
          properties: {
            firstName: { type: "string", example: "Suraj" },
            lastName:  { type: "string", example: "Mane" },
            email:     { type: "string", example: "suraj@test.com" },
            password:  { type: "string", example: "secret123" },
            role:      { type: "string", enum: ["admin","owner","kitchen","cashier","customer"] },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email:    { type: "string", example: "suraj@test.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        // ── Restaurant ───────────────────────────────────────────────────
        CreateRestaurantInput: {
          type: "object",
          required: ["name"],
          properties: {
            name:           { type: "string", example: "Spice Garden" },
            descriptions:   { type: "string" },
            phone:          { type: "string", example: "9876543210" },
            city:           { type: "string", example: "Nagpur" },
            state:          { type: "string", example: "Maharashtra" },
            tax_percentage: { type: "number", example: 5 },
          },
        },
        // ── Menu Item ─────────────────────────────────────────────────────
        CreateMenuItemInput: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name:         { type: "string",  example: "Paneer Tikka" },
            description:  { type: "string" },
            price:        { type: "number",  example: 280 },
            image_url:    { type: "string" },
            is_available: { type: "boolean", example: true },
          },
        },
        // ── Order ─────────────────────────────────────────────────────────
        CreateOrderInput: {
          type: "object",
          required: ["restaurant_id", "items"],
          properties: {
            restaurant_id: { type: "integer", example: 1 },
            items: {
              type:  "array",
              items: {
                type: "object",
                properties: {
                  menu_item_id: { type: "integer", example: 1 },
                  quantity:     { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        // ── Responses ────────────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data:    { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                data: { type: "array", items: { type: "object" } },
                pagination: {
                  type: "object",
                  properties: {
                    page:  { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                    pages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "DineFlow API Docs",
      customCss: `
        .swagger-ui .topbar { background-color: #0e0f11; }
        .swagger-ui .topbar-wrapper img { content: url(''); }
        .swagger-ui .topbar-wrapper::after {
          content: 'DINEFLOW API';
          color: #f59e0b;
          font-size: 20px;
          font-weight: 800;
        }
      `,
    })
  );

  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};