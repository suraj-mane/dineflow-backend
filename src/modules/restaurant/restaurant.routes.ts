import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import {
    createRestaurantController,
    listRestaurantsController,
    getRestaurantController,
    updateRestaurantController,
    getRestaurantDashboardController,
    getRestaurantMenuController,
} from "./restaurant.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post("/", authorize(["owner"]), createRestaurantController);
router.get("/", authorize(["owner"]), listRestaurantsController);
router.get("/:id", authorize(["owner"]), getRestaurantController);
router.patch("/:id", authorize(["owner"]), updateRestaurantController);
router.get("/:id/dashboard", authorize(["owner", "admin"]), getRestaurantDashboardController);
router.get("/:id/menu", authorize(["owner", "admin", "customer", "kitchen"]), getRestaurantMenuController);

export default router;