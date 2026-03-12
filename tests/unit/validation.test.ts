import { registerSchema, loginSchema } from "../../src/modules/auth/auth.validation";
import { createRestaurantSchema } from "../../src/modules/restaurant/restaurant.validation";
import { createCategorySchema } from "../../src/modules/category/category.validation";
import { createMenuItemSchema } from "../../src/modules/menu-item/menuItem.validation";

// ── Auth ──────────────────────────────────────────────────────────────────────
describe("registerSchema", () => {

    const valid = {
        firstName: "Suraj",
        lastName: "Mane",
        email: "suraj@test.com",
        password: "secret123",
        role: "owner",
    };

    it("accepts valid input", () => {
        expect(registerSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid email", () => {
        expect(registerSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
    });

    it("rejects password under 6 chars", () => {
        expect(registerSchema.safeParse({ ...valid, password: "123" }).success).toBe(false);
    });

    it("rejects invalid role", () => {
        expect(registerSchema.safeParse({ ...valid, role: "superadmin" }).success).toBe(false);
    });

    it("rejects firstName under 2 chars", () => {
        expect(registerSchema.safeParse({ ...valid, firstName: "S" }).success).toBe(false);
    });

    it("accepts all valid roles", () => {
        const roles = ["admin", "owner", "kitchen", "cashier", "customer"];
        roles.forEach(role => {
            expect(registerSchema.safeParse({ ...valid, role }).success).toBe(true);
        });
    });

});

describe("loginSchema", () => {

    it("accepts valid credentials", () => {
        expect(loginSchema.safeParse({ email: "a@b.com", password: "pass123" }).success).toBe(true);
    });

    it("rejects missing password", () => {
        expect(loginSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    });

    it("rejects missing email", () => {
        expect(loginSchema.safeParse({ password: "pass123" }).success).toBe(false);
    });

});

// ── Restaurant ────────────────────────────────────────────────────────────────
describe("createRestaurantSchema", () => {

    it("accepts name only", () => {
        expect(createRestaurantSchema.safeParse({ name: "Spice Garden" }).success).toBe(true);
    });

    it("rejects name under 2 chars", () => {
        expect(createRestaurantSchema.safeParse({ name: "S" }).success).toBe(false);
    });

    it("rejects tax_percentage over 100", () => {
        expect(createRestaurantSchema.safeParse({ name: "Test", tax_percentage: 101 }).success).toBe(false);
    });

    it("rejects negative tax_percentage", () => {
        expect(createRestaurantSchema.safeParse({ name: "Test", tax_percentage: -1 }).success).toBe(false);
    });

    it("accepts full valid input", () => {
        expect(createRestaurantSchema.safeParse({
            name: "Spice Garden",
            city: "Nagpur",
            state: "Maharashtra",
            phone: "9876543210",
            tax_percentage: 5,
        }).success).toBe(true);
    });

});

// ── Category ──────────────────────────────────────────────────────────────────
describe("createCategorySchema", () => {

    it("accepts valid input", () => {
        expect(createCategorySchema.safeParse({ name: "Starters" }).success).toBe(true);
    });

    it("rejects name under 2 chars", () => {
        expect(createCategorySchema.safeParse({ name: "S" }).success).toBe(false);
    });

    it("rejects negative display_order", () => {
        expect(createCategorySchema.safeParse({ name: "Main", display_order: -1 }).success).toBe(false);
    });

    it("accepts optional fields", () => {
        expect(createCategorySchema.safeParse({
            name: "Desserts",
            description: "Sweet treats",
            display_order: 3,
        }).success).toBe(true);
    });

});

// ── Menu Item ─────────────────────────────────────────────────────────────────
describe("createMenuItemSchema", () => {

    const valid = { name: "Paneer Tikka", price: 280 };

    it("accepts valid input", () => {
        expect(createMenuItemSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects zero price", () => {
        expect(createMenuItemSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
    });

    it("rejects negative price", () => {
        expect(createMenuItemSchema.safeParse({ ...valid, price: -10 }).success).toBe(false);
    });

    it("rejects invalid image_url", () => {
        expect(createMenuItemSchema.safeParse({ ...valid, image_url: "not-a-url" }).success).toBe(false);
    });

    it("accepts valid image_url", () => {
        expect(createMenuItemSchema.safeParse({
            ...valid,
            image_url: "https://example.com/image.jpg",
        }).success).toBe(true);
    });

    it("accepts is_available boolean", () => {
        expect(createMenuItemSchema.safeParse({ ...valid, is_available: false }).success).toBe(true);
    });

});