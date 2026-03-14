import { Request, Response } from "express";
import { asyncHandler }      from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import {
  uploadMenuItemImage,
  uploadRestaurantLogo,
  deleteMenuItemImage,
} from "./upload.service";

// POST /api/upload/menu-items/:id/image
export const uploadMenuItemImageController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return errorResponse(res, "No image file provided", 400);
    }

    const result = await uploadMenuItemImage(
      Number(req.params.id),
      req.user.id,
      req.file.buffer
    );

    return successResponse(res, "Image uploaded successfully", result);
  }
);

// POST /api/upload/restaurants/:id/logo
export const uploadRestaurantLogoController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return errorResponse(res, "No image file provided", 400);
    }

    const result = await uploadRestaurantLogo(
      Number(req.params.id),
      req.user.id,
      req.file.buffer
    );

    return successResponse(res, "Logo uploaded successfully", result);
  }
);

// DELETE /api/upload/menu-items/:id/image
export const deleteMenuItemImageController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteMenuItemImage(Number(req.params.id), req.user.id);
    return successResponse(res, "Image deleted successfully");
  }
);