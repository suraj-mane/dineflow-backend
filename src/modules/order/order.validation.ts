import { z } from "zod";

export const createOrderSchema = z.object({
  restaurant_id: z.number().int().positive("Restaurant ID must be positive"),
  items: z
    .array(
      z.object({
        menu_item_id: z.number().int().positive("Menu item ID must be positive"),
        quantity:     z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Order must have at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "preparing", "ready", "completed", "cancelled"]),
});