import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize }    from "../../middleware/rbac.middleware";
import {
  createRestaurantController,
  listRestaurantsController,
  getRestaurantController,
  updateRestaurantController,
  getRestaurantDashboardController,
  getRestaurantMenuController,
} from "./restaurant.controller";
import { getRestaurantOrdersController } from "../order/order.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create a new restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurantInput'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 */
router.post("/", authorize(["owner"]), createRestaurantController);

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: List all restaurants for the authenticated owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get("/", authorize(["owner"]), listRestaurantsController);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get a single restaurant by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Restaurant details
 *       404:
 *         description: Not found
 */
router.get("/:id", authorize(["owner"]), getRestaurantController);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   patch:
 *     tags: [Restaurants]
 *     summary: Update a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Restaurant updated
 */
router.patch("/:id", authorize(["owner"]), updateRestaurantController);

/**
 * @swagger
 * /api/restaurants/{id}/dashboard:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant analytics dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get("/:id/dashboard", authorize(["owner", "admin"]), getRestaurantDashboardController);

/**
 * @swagger
 * /api/restaurants/{id}/menu:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get full restaurant menu (Redis cached)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Full menu grouped by category
 */
router.get("/:id/menu", authorize(["owner", "admin", "customer", "kitchen"]), getRestaurantMenuController);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders for a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated orders list
 */
router.get("/:restaurantId/orders", authorize(["owner", "admin", "kitchen"]), getRestaurantOrdersController);

export default router;