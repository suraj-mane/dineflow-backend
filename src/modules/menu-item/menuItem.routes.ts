import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import {
    createMenuItemController,
    listMenuItemsController,
    updateMenuItemController,
    deleteMenuItemController,
} from "./menuItem.controller";

const router = Router();

router.use(authenticate);

// Category-scoped
router.post(
    "/categories/:categoryId/menu-items",
    authorize(["owner"]),
    createMenuItemController
);
router.get(
    "/categories/:categoryId/menu-items",
    authorize(["owner", "admin", "kitchen"]),
    listMenuItemsController
);

// Item-scoped
router.patch(
    "/menu-items/:id",
    authorize(["owner"]),
    updateMenuItemController
);
router.delete(
    "/menu-items/:id",
    authorize(["owner"]),
    deleteMenuItemController
);

export default router;