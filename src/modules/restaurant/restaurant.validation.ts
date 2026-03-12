import { z } from "zod";

export const createRestaurantSchema = z.object({
  name:           z.string().min(2, "Name must be at least 2 characters"),
  descriptions:   z.string().optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  postal_code:    z.string().optional(),
  latitude:       z.number().optional(),
  longitude:      z.number().optional(),
  tax_percentage: z.number().min(0).max(100).optional(),
});

export const updateRestaurantSchema = z.object({
  name:             z.string().min(2).optional(),
  descriptions:     z.string().optional(),
  phone:            z.string().optional(),
  address:          z.string().optional(),
  city:             z.string().optional(),
  state:            z.string().optional(),
  postal_code:      z.string().optional(),
  latitude:         z.number().optional(),
  longitude:        z.number().optional(),
  tax_percentage:   z.number().min(0).max(100).optional(),
  is_open:          z.boolean().optional(),
  accepting_orders: z.boolean().optional(),
});