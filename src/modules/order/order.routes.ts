import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize }    from "../../middleware/rbac.middleware";
import {
  createOrderController,
  getOrderController,
  getMyOrdersController,
  updateOrderStatusController,
  cancelOrderController,
} from "./order.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Restaurant closed or items unavailable
 */
router.post("/", authorize(["customer"]), createOrderController);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     tags: [Orders]
 *     summary: Get current customer's orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Paginated customer orders
 */
router.get("/my", authorize(["customer"]), getMyOrdersController);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
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
 *         description: Order details with items
 *       404:
 *         description: Order not found
 */
router.get("/:id", authorize(["owner", "admin", "kitchen", "customer"]), getOrderController);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (owner/kitchen only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status transition
 */
router.patch("/:id/status", authorize(["owner", "kitchen"]), updateOrderStatusController);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order (customer only)
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
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel at this stage
 */
router.patch("/:id/cancel", authorize(["customer"]), cancelOrderController);

export default router;