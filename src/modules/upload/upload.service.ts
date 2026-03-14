import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { db } from "../../config/database";
import { RowDataPacket } from "mysql2";
import logger from "../../utils/logger";

// ── Upload to Cloudinary ──────────────────────────────────────────────────────
export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string,
    publicId?: string
): Promise<{ url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                transformation: [
                    { width: 800, height: 600, crop: "limit" },
                    { quality: "auto", fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Cloudinary upload failed"));
                } else {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// ── Delete from Cloudinary ────────────────────────────────────────────────────
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`Deleted from Cloudinary: ${publicId}`);
    } catch (err) {
        logger.warn(`Failed to delete from Cloudinary: ${publicId}`);
    }
};

// ── Upload Menu Item Image ────────────────────────────────────────────────────
export const uploadMenuItemImage = async (
    menuItemId: number,
    ownerId: number,
    buffer: Buffer
) => {
    // Verify ownership
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT m.id, m.image_url, m.restaurant_id
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

    const item = (rows as any[])[0];

    // Delete old image if exists
    if (item.image_url) {
        const publicId = extractPublicId(item.image_url);
        if (publicId) await deleteFromCloudinary(publicId);
    }

    // Upload new image
    const result = await uploadToCloudinary(
        buffer,
        `dineflow/restaurants/${item.restaurant_id}/menu-items`,
        `menu-item-${menuItemId}`
    );

    // Update DB
    await db.execute(
        "UPDATE menu_items SET image_url = ? WHERE id = ?",
        [result.url, menuItemId]
    );

    logger.info(`Menu item #${menuItemId} image uploaded: ${result.url}`);

    return { image_url: result.url };
};

// ── Upload Restaurant Logo ────────────────────────────────────────────────────
export const uploadRestaurantLogo = async (
    restaurantId: number,
    ownerId: number,
    buffer: Buffer
) => {
    // Verify ownership
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM restaurants WHERE id = ? AND owner_id = ?",
        [restaurantId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Restaurant not found or access denied");
        err.status = 404;
        throw err;
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
        buffer,
        `dineflow/restaurants/${restaurantId}`,
        `restaurant-logo-${restaurantId}`
    );

    // Save to restaurant_locations or a new column
    // We'll add logo_url to restaurants table
    await db.execute(
        "UPDATE restaurants SET logo_url = ? WHERE id = ?",
        [result.url, restaurantId]
    );

    logger.info(`Restaurant #${restaurantId} logo uploaded: ${result.url}`);

    return { logo_url: result.url };
};

// ── Delete Menu Item Image ────────────────────────────────────────────────────
export const deleteMenuItemImage = async (
    menuItemId: number,
    ownerId: number
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT m.id, m.image_url
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

    const item = (rows as any[])[0];

    if (!item.image_url) {
        const err: any = new Error("No image to delete");
        err.status = 400;
        throw err;
    }

    const publicId = extractPublicId(item.image_url);
    if (publicId) await deleteFromCloudinary(publicId);

    await db.execute(
        "UPDATE menu_items SET image_url = NULL WHERE id = ?",
        [menuItemId]
    );

    return { success: true };
};

// ── Helper — Extract public_id from Cloudinary URL ────────────────────────────
const extractPublicId = (url: string): string | null => {
    try {
        const parts = url.split("/");
        const filename = parts[parts.length - 1].split(".")[0];
        const folder = parts.slice(parts.indexOf("dineflow")).slice(0, -1).join("/");
        return `${folder}/${filename}`;
    } catch {
        return null;
    }
};