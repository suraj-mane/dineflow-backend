import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize }    from "../../middleware/rbac.middleware";
import {
  createMenuItemController,
  listMenuItemsController,
  updateMenuItemController,
  deleteMenuItemController,
} from "./menuItem.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/categories/{categoryId}/menu-items:
 *   post:
 *     tags: [Menu Items]
 *     summary: Create a new menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuItemInput'
 *     responses:
 *       201:
 *         description: Menu item created
 */
router.post(
  "/categories/:categoryId/menu-items",
  authorize(["owner"]),
  createMenuItemController
);

/**
 * @swagger
 * /api/categories/{categoryId}/menu-items:
 *   get:
 *     tags: [Menu Items]
 *     summary: List all menu items in a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of menu items
 */
router.get(
  "/categories/:categoryId/menu-items",
  authorize(["owner", "admin", "kitchen"]),
  listMenuItemsController
);

/**
 * @swagger
 * /api/menu-items/{id}:
 *   patch:
 *     tags: [Menu Items]
 *     summary: Update a menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               is_available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu item updated
 */
router.patch(
  "/menu-items/:id",
  authorize(["owner"]),
  updateMenuItemController
);

/**
 * @swagger
 * /api/menu-items/{id}:
 *   delete:
 *     tags: [Menu Items]
 *     summary: Delete a menu item
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
 *         description: Menu item deleted
 */
router.delete(
  "/menu-items/:id",
  authorize(["owner"]),
  deleteMenuItemController
);

export default router;