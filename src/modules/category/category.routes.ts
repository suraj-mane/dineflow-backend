import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import {
    createCategoryController,
    listCategoriesController,
    updateCategoryController,
    deleteCategoryController,
} from "./category.controller";

const router = Router();

router.use(authenticate);

// Restaurant-scoped
router.post(
    "/restaurants/:restaurantId/categories",
    authorize(["owner"]),
    createCategoryController
);
router.get(
    "/restaurants/:restaurantId/categories",
    authorize(["owner", "admin", "kitchen"]),
    listCategoriesController
);

// Category-scoped
router.patch(
    "/categories/:id",
    authorize(["owner"]),
    updateCategoryController
);
router.delete(
    "/categories/:id",
    authorize(["owner"]),
    deleteCategoryController
);

export default router;