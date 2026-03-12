import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../../config/database";
import redis from "../../config/redis";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.types";

// ── Helper — verify restaurant ownership ─────────────────────────────────────
const verifyRestaurantOwner = async (
    restaurantId: number,
    ownerId: number
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM restaurants WHERE id = ? AND owner_id = ?",
        [restaurantId, ownerId]
    );
    if ((rows as any[]).length === 0) {
        const err: any = new Error("Restaurant not found or access denied");
        err.status = 403;
        throw err;
    }
};

// ── Create Category ───────────────────────────────────────────────────────────
export const createCategory = async (
    restaurantId: number,
    ownerId: number,
    data: CreateCategoryInput
) => {
    await verifyRestaurantOwner(restaurantId, ownerId);

    const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO categories
     (restaurant_id, name, description, display_order)
     VALUES (?, ?, ?, ?)`,
        [
            restaurantId,
            data.name,
            data.description ?? null,
            data.display_order ?? 0,
        ]
    );

    return {
        id: result.insertId,
        restaurant_id: restaurantId,
        ...data,
    };
};

// ── List Categories ───────────────────────────────────────────────────────────
export const getCategoriesByRestaurant = async (
    restaurantId: number,
    ownerId: number
) => {
    await verifyRestaurantOwner(restaurantId, ownerId);

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, name, description, display_order
     FROM categories
     WHERE restaurant_id = ?
     ORDER BY display_order ASC, name ASC`,
        [restaurantId]
    );

    return rows;
};

// ── Update Category ───────────────────────────────────────────────────────────
export const updateCategory = async (
    categoryId: number,
    ownerId: number,
    data: UpdateCategoryInput
) => {
    // Verify ownership via join
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT c.id, c.restaurant_id
     FROM categories c
     JOIN restaurants r ON c.restaurant_id = r.id
     WHERE c.id = ? AND r.owner_id = ?`,
        [categoryId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Category not found or access denied");
        err.status = 404;
        throw err;
    }

    const restaurantId = (rows as any[])[0].restaurant_id;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
    if (data.display_order !== undefined) { fields.push("display_order = ?"); values.push(data.display_order); }

    if (fields.length === 0) {
        const err: any = new Error("No fields provided for update");
        err.status = 400;
        throw err;
    }

    await db.execute(
        `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
        [...values, categoryId]
    );

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return { success: true };
};

// ── Delete Category ───────────────────────────────────────────────────────────
export const deleteCategory = async (
    categoryId: number,
    ownerId: number
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT c.id, c.restaurant_id
     FROM categories c
     JOIN restaurants r ON c.restaurant_id = r.id
     WHERE c.id = ? AND r.owner_id = ?`,
        [categoryId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Category not found or access denied");
        err.status = 404;
        throw err;
    }

    const restaurantId = (rows as any[])[0].restaurant_id;

    await db.execute("DELETE FROM categories WHERE id = ?", [categoryId]);

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return { success: true };
};