import { z } from "zod";

export const createMenuItemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.number().positive("Price must be greater than 0"),
    image_url: z.string().url("Invalid image URL").optional(),
    is_available: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    image_url: z.string().url().optional(),
    is_available: z.boolean().optional(),
});