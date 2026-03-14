import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize }    from "../../middleware/rbac.middleware";
import {
  createCategoryController,
  listCategoriesController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Starters
 *               description:
 *                 type: string
 *               display_order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *       403:
 *         description: Access denied
 */
router.post(
  "/restaurants/:restaurantId/categories",
  authorize(["owner"]),
  createCategoryController
);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories for a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get(
  "/restaurants/:restaurantId/categories",
  authorize(["owner", "admin", "kitchen"]),
  listCategoriesController
);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category
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
 *               description:
 *                 type: string
 *               display_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch(
  "/categories/:id",
  authorize(["owner"]),
  updateCategoryController
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
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
 *         description: Category deleted
 */
router.delete(
  "/categories/:id",
  authorize(["owner"]),
  deleteCategoryController
);

export default router;