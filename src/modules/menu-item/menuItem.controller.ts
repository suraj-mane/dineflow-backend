import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { createMenuItemSchema, updateMenuItemSchema } from "./menuItem.validation";
import {
    createMenuItem,
    getMenuItemsByCategory,
    updateMenuItem,
    deleteMenuItem,
} from "./menuItem.service";

// POST /api/categories/:categoryId/menu-items
export const createMenuItemController = asyncHandler(
    async (req: Request, res: Response) => {
        const categoryId = Number(req.params.categoryId);
        const data = createMenuItemSchema.parse(req.body);
        const result = await createMenuItem(categoryId, req.user.id, data);
        return successResponse(res, "Menu item created successfully", result, 201);
    }
);

// GET /api/categories/:categoryId/menu-items
export const listMenuItemsController = asyncHandler(
    async (req: Request, res: Response) => {
        const categoryId = Number(req.params.categoryId);
        const data = await getMenuItemsByCategory(categoryId, req.user.id);
        return successResponse(res, "Menu items fetched successfully", data);
    }
);

// PATCH /api/menu-items/:id
export const updateMenuItemController = asyncHandler(
    async (req: Request, res: Response) => {
        const menuItemId = Number(req.params.id);
        const data = updateMenuItemSchema.parse(req.body);
        await updateMenuItem(menuItemId, req.user.id, data);
        return successResponse(res, "Menu item updated successfully");
    }
);

// DELETE /api/menu-items/:id
export const deleteMenuItemController = asyncHandler(
    async (req: Request, res: Response) => {
        const menuItemId = Number(req.params.id);
        await deleteMenuItem(menuItemId, req.user.id);
        return successResponse(res, "Menu item deleted successfully");
    }
);