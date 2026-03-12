import { Request, Response } from "express";
import { asyncHandler }      from "../../utils/asyncHandler";
import { successResponse }   from "../../utils/response";
import { createRestaurantSchema, updateRestaurantSchema } from "./restaurant.validation";
import {
  createRestaurant,
  getOwnerRestaurants,
  getRestaurantById,
  updateRestaurant,
  getRestaurantDashboard,
  getRestaurantMenu,
} from "./restaurant.service";

// POST /api/restaurants
export const createRestaurantController = asyncHandler(
  async (req: Request, res: Response) => {
    const data   = createRestaurantSchema.parse(req.body);
    const result = await createRestaurant(data, req.user.id);
    return successResponse(res, "Restaurant created successfully", result, 201);
  }
);

// GET /api/restaurants
export const listRestaurantsController = asyncHandler(
  async (req: Request, res: Response) => {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const data  = await getOwnerRestaurants(req.user.id, page, limit);
    return successResponse(res, "Restaurants fetched successfully", data);
  }
);

// GET /api/restaurants/:id
export const getRestaurantController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getRestaurantById(Number(req.params.id), req.user.id);
    return successResponse(res, "Restaurant fetched successfully", data);
  }
);

// PATCH /api/restaurants/:id
export const updateRestaurantController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateRestaurantSchema.parse(req.body);
    await updateRestaurant(Number(req.params.id), req.user.id, data);
    return successResponse(res, "Restaurant updated successfully");
  }
);

// GET /api/restaurants/:id/dashboard
export const getRestaurantDashboardController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getRestaurantDashboard(Number(req.params.id), req.user.id);
    return successResponse(res, "Dashboard fetched successfully", data);
  }
);

// GET /api/restaurants/:id/menu
export const getRestaurantMenuController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getRestaurantMenu(Number(req.params.id));
    return successResponse(res, "Menu fetched successfully", data);
  }
);