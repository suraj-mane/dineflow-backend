import { z } from "zod";

export const createCategorySchema = z.object({
  name:          z.string().min(2, "Name must be at least 2 characters"),
  description:   z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name:          z.string().min(2).optional(),
  description:   z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});