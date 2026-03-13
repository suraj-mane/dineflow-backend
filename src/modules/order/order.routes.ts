import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import {
    createOrderController,
    getOrderController,
    getMyOrdersController,
    updateOrderStatusController,
    cancelOrderController,
} from "./order.controller";

const router = Router();

router.use(authenticate);

// Customer routes
router.post("/", authorize(["customer"]), createOrderController);
router.get("/my", authorize(["customer"]), getMyOrdersController);
router.patch("/:id/cancel", authorize(["customer"]), cancelOrderController);

// Shared — any authenticated role
router.get("/:id", authorize(["owner", "admin", "kitchen", "customer"]), getOrderController);

// Owner / kitchen routes
router.patch(
    "/:id/status",
    authorize(["owner", "kitchen"]),
    updateOrderStatusController
);

export default router;