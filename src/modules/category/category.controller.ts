import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { createCategorySchema, updateCategorySchema } from "./category.validation";
import {
    createCategory,
    getCategoriesByRestaurant,
    updateCategory,
    deleteCategory,
} from "./category.service";

// POST /api/restaurants/:restaurantId/categories
export const createCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const restaurantId = Number(req.params.restaurantId);
        const data = createCategorySchema.parse(req.body);
        const result = await createCategory(restaurantId, req.user.id, data);
        return successResponse(res, "Category created successfully", result, 201);
    }
);

// GET /api/restaurants/:restaurantId/categories
export const listCategoriesController = asyncHandler(
    async (req: Request, res: Response) => {
        const restaurantId = Number(req.params.restaurantId);
        const data = await getCategoriesByRestaurant(restaurantId, req.user.id);
        return successResponse(res, "Categories fetched successfully", data);
    }
);

// PATCH /api/categories/:id
export const updateCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const categoryId = Number(req.params.id);
        const data = updateCategorySchema.parse(req.body);
        await updateCategory(categoryId, req.user.id, data);
        return successResponse(res, "Category updated successfully");
    }
);

// DELETE /api/categories/:id
export const deleteCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const categoryId = Number(req.params.id);
        await deleteCategory(categoryId, req.user.id);
        return successResponse(res, "Category deleted successfully");
    }
);