import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../../config/database";
import redis from "../../config/redis";
import { CreateMenuItemInput, UpdateMenuItemInput } from "./menuItem.types";

// ── Helper — verify category belongs to owner ─────────────────────────────────
const verifyCategoryOwner = async (categoryId: number, ownerId: number) => {
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

    return (rows as any[])[0].restaurant_id as number;
};

// ── Create Menu Item ──────────────────────────────────────────────────────────
export const createMenuItem = async (
    categoryId: number,
    ownerId: number,
    data: CreateMenuItemInput
) => {
    const restaurantId = await verifyCategoryOwner(categoryId, ownerId);

    const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO menu_items
     (restaurant_id, category_id, name, description, price, image_url, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            restaurantId,
            categoryId,
            data.name,
            data.description ?? null,
            data.price,
            data.image_url ?? null,
            data.is_available ?? true,
        ]
    );

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return {
        id: result.insertId,
        restaurant_id: restaurantId,
        category_id: categoryId,
        ...data,
    };
};

// ── List Menu Items by Category ───────────────────────────────────────────────
export const getMenuItemsByCategory = async (
    categoryId: number,
    ownerId: number
) => {
    await verifyCategoryOwner(categoryId, ownerId);

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
       id, name, description, price,
       image_url, is_available, created_at
     FROM menu_items
     WHERE category_id = ?
     ORDER BY name ASC`,
        [categoryId]
    );

    return rows;
};

// ── Update Menu Item ──────────────────────────────────────────────────────────
export const updateMenuItem = async (
    menuItemId: number,
    ownerId: number,
    data: UpdateMenuItemInput
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT m.id, m.restaurant_id
     FROM menu_items m
     JOIN restaurants r ON m.restaurant_id = r.id
     WHERE m.id = ? AND r.owner_id = ?`,
        [menuItemId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Menu item not found or access denied");
        err.status = 404;
        throw err;
    }

    const restaurantId = (rows as any[])[0].restaurant_id;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
    if (data.price !== undefined) { fields.push("price = ?"); values.push(data.price); }
    if (data.image_url !== undefined) { fields.push("image_url = ?"); values.push(data.image_url); }
    if (data.is_available !== undefined) { fields.push("is_available = ?"); values.push(data.is_available); }

    if (fields.length === 0) {
        const err: any = new Error("No fields provided for update");
        err.status = 400;
        throw err;
    }

    await db.execute(
        `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`,
        [...values, menuItemId]
    );

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return { success: true };
};

// ── Delete Menu Item ──────────────────────────────────────────────────────────
export const deleteMenuItem = async (
    menuItemId: number,
    ownerId: number
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT m.id, m.restaurant_id
     FROM menu_items m
     JOIN restaurants r ON m.restaurant_id = r.id
     WHERE m.id = ? AND r.owner_id = ?`,
        [menuItemId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Menu item not found or access denied");
        err.status = 404;
        throw err;
    }

    const restaurantId = (rows as any[])[0].restaurant_id;

    await db.execute("DELETE FROM menu_items WHERE id = ?", [menuItemId]);

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return { success: true };
};