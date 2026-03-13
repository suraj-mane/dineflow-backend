import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { createOrderSchema, updateOrderStatusSchema } from "./order.validation";
import {
    createOrder,
    getOrderById,
    getRestaurantOrders,
    getCustomerOrders,
    updateOrderStatus,
    cancelOrder,
} from "./order.service";

// POST /api/orders
export const createOrderController = asyncHandler(
    async (req: Request, res: Response) => {
        const data = createOrderSchema.parse(req.body);
        const result = await createOrder(req.user.id, data);
        return successResponse(res, "Order placed successfully", result, 201);
    }
);

// GET /api/orders/:id
export const getOrderController = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await getOrderById(
            Number(req.params.id),
            req.user.id,
            req.user.role
        );
        return successResponse(res, "Order fetched successfully", data);
    }
);

// GET /api/restaurants/:restaurantId/orders
export const getRestaurantOrdersController = asyncHandler(
    async (req: Request, res: Response) => {
        const restaurantId = Number(req.params.restaurantId);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;
        const data = await getRestaurantOrders(
            restaurantId, req.user.id, page, limit, status
        );
        return successResponse(res, "Orders fetched successfully", data);
    }
);

// GET /api/orders/my
export const getMyOrdersController = asyncHandler(
    async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const data = await getCustomerOrders(req.user.id, page, limit);
        return successResponse(res, "Orders fetched successfully", data);
    }
);

// PATCH /api/orders/:id/status
export const updateOrderStatusController = asyncHandler(
    async (req: Request, res: Response) => {
        const data = updateOrderStatusSchema.parse(req.body);
        const result = await updateOrderStatus(
            Number(req.params.id),
            req.user.id,
            data
        );
        return successResponse(res, "Order status updated successfully", result);
    }
);

// PATCH /api/orders/:id/cancel
export const cancelOrderController = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await cancelOrder(Number(req.params.id), req.user.id);
        return successResponse(res, "Order cancelled successfully", result);
    }
);