import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize }    from "../../middleware/rbac.middleware";
import { upload }       from "../../config/multer";
import {
  uploadMenuItemImageController,
  uploadRestaurantLogoController,
  deleteMenuItemImageController,
} from "./upload.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/upload/menu-items/{id}/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload menu item image
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded — returns image_url
 */
router.post(
  "/menu-items/:id/image",
  authorize(["owner"]),
  upload.single("image"),
  uploadMenuItemImageController
);

/**
 * @swagger
 * /api/upload/restaurants/{id}/logo:
 *   post:
 *     tags: [Upload]
 *     summary: Upload restaurant logo
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded — returns logo_url
 */
router.post(
  "/restaurants/:id/logo",
  authorize(["owner"]),
  upload.single("image"),
  uploadRestaurantLogoController
);

/**
 * @swagger
 * /api/upload/menu-items/{id}/image:
 *   delete:
 *     tags: [Upload]
 *     summary: Delete menu item image
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
 *         description: Image deleted
 */
router.delete(
  "/menu-items/:id/image",
  authorize(["owner"]),
  deleteMenuItemImageController
);

export default router;