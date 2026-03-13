import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../../config/database";
import { getIO } from "../../config/socket";
import { orderQueue } from "../../jobs/orderQueue";
import { CreateOrderInput, UpdateOrderStatusInput } from "./order.types";

// ── Create Order ──────────────────────────────────────────────────────────────
export const createOrder = async (
    customerId: number,
    data: CreateOrderInput
) => {
    const { restaurant_id, items } = data;

    // 1. Check restaurant is open and accepting orders
    const [settingsRows] = await db.execute<RowDataPacket[]>(
        `SELECT is_open, accepting_orders
     FROM restaurant_settings
     WHERE restaurant_id = ?`,
        [restaurant_id]
    );

    const settings = (settingsRows as any[])[0];
    if (!settings) {
        const err: any = new Error("Restaurant not found");
        err.status = 404;
        throw err;
    }
    if (!settings.is_open || !settings.accepting_orders) {
        const err: any = new Error("Restaurant is not accepting orders right now");
        err.status = 400;
        throw err;
    }

    // 2. Fetch and validate all menu items
    const menuItemIds = items.map((i) => i.menu_item_id);
    const [menuRows] = await db.execute<RowDataPacket[]>(
        `SELECT id, price, is_available, name
     FROM menu_items
     WHERE id IN (${menuItemIds.map(() => "?").join(",")})
     AND restaurant_id = ?`,
        [...menuItemIds, restaurant_id]
    );

    if ((menuRows as any[]).length !== menuItemIds.length) {
        const err: any = new Error("One or more menu items not found");
        err.status = 404;
        throw err;
    }

    // 3. Check all items are available
    const unavailable = (menuRows as any[]).filter((r) => !r.is_available);
    if (unavailable.length > 0) {
        const names = unavailable.map((r: any) => r.name).join(", ");
        const err: any = new Error(`Items unavailable: ${names}`);
        err.status = 400;
        throw err;
    }

    // 4. Calculate total
    const menuMap = new Map(
        (menuRows as any[]).map((r: any) => [r.id, r])
    );
    const total = items.reduce((sum, item) => {
        const menuItem = menuMap.get(item.menu_item_id) as any;
        return sum + menuItem.price * item.quantity;
    }, 0);

    // 5. Create order in transaction
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO orders
       (restaurant_id, customer_id, status, total_amount)
       VALUES (?, ?, 'pending', ?)`,
            [restaurant_id, customerId, total]
        );
        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            const menuItem = menuMap.get(item.menu_item_id) as any;
            await connection.execute(
                `INSERT INTO order_items
         (order_id, menu_item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
                [orderId, item.menu_item_id, item.quantity, menuItem.price]
            );
        }

        // Update restaurant total_orders stat
        await connection.execute(
            `UPDATE restaurant_stats
       SET total_orders = total_orders + 1
       WHERE restaurant_id = ?`,
            [restaurant_id]
        );

        await connection.commit();

        // 6. Queue auto-cancel job (5 min timeout if not confirmed)
        const job = await orderQueue.add(
            "auto-cancel",
            { orderId, restaurantId: restaurant_id },
            { delay: 5 * 60 * 1000, jobId: `order_timeout_${orderId}` }
        );

        // Save job ID to DB
        await db.execute(
            "UPDATE orders SET timeout_job_id = ? WHERE id = ?",
            [String(job.id), orderId]
        );

        // 7. Emit real-time event to restaurant
        try {
            const io = getIO();
            io.to(`restaurant_${restaurant_id}`).emit("new-order", {
                orderId,
                total,
                itemCount: items.length,
            });
        } catch {
            // Socket not critical — order still created
        }

        return { order_id: orderId, total, status: "pending" };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ── Get Order by ID ───────────────────────────────────────────────────────────
export const getOrderById = async (
    orderId: number,
    requesterId: number,
    requesterRole: string
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
       o.id as order_id, o.restaurant_id, o.customer_id,
       o.status, o.total_amount as total, o.created_at,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'name',     m.name,
           'quantity', oi.quantity,
           'price',    oi.price
         )
       ) as items
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN menu_items  m  ON oi.menu_item_id = m.id
     WHERE o.id = ?
     GROUP BY o.id`,
        [orderId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Order not found");
        err.status = 404;
        throw err;
    }

    const order = (rows as any[])[0];

    // Customers can only see their own orders
    if (requesterRole === "customer" && order.customer_id !== requesterId) {
        const err: any = new Error("Access denied");
        err.status = 403;
        throw err;
    }

    // Parse items JSON string if needed
    if (typeof order.items === "string") {
        order.items = JSON.parse(order.items);
    }

    return order;
};

// ── List Orders for Restaurant ────────────────────────────────────────────────
export const getRestaurantOrders = async (
    restaurantId: number,
    ownerId: number,
    page: number,
    limit: number,
    status?: string
) => {
    // Verify ownership
    const [check] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM restaurants WHERE id = ? AND owner_id = ?",
        [restaurantId, ownerId]
    );
    if ((check as any[]).length === 0) {
        const err: any = new Error("Restaurant not found or access denied");
        err.status = 403;
        throw err;
    }

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const offset = (safePage - 1) * safeLimit;

    const whereClause = status
        ? "WHERE o.restaurant_id = ? AND o.status = ?"
        : "WHERE o.restaurant_id = ?";

    const queryParams: (string | number)[] = status
        ? [restaurantId, status]
        : [restaurantId];

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
       o.id as order_id, o.status,
       o.total_amount as total, o.created_at,
       u.first_name, u.last_name
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
        [...queryParams, String(safeLimit), String(offset)]
    );

    const [[countRow]] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        queryParams
    );

    return {
        data: rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: (countRow as any).total,
            pages: Math.ceil((countRow as any).total / safeLimit),
        },
    };
};

// ── List Orders for Customer ──────────────────────────────────────────────────
export const getCustomerOrders = async (
    customerId: number,
    page: number,
    limit: number
) => {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const offset = (safePage - 1) * safeLimit;

    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
       o.id as order_id, o.restaurant_id,
       r.name as restaurant_name,
       o.status, o.total_amount as total, o.created_at
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
        [customerId, String(safeLimit), String(offset)]
    );

    const [[countRow]] = await db.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM orders WHERE customer_id = ?",
        [customerId]
    );

    return {
        data: rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: (countRow as any).total,
            pages: Math.ceil((countRow as any).total / safeLimit),
        },
    };
};

// ── Update Order Status ───────────────────────────────────────────────────────
export const updateOrderStatus = async (
    orderId: number,
    ownerId: number,
    data: UpdateOrderStatusInput
) => {
    // Verify order belongs to owner's restaurant
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT o.id, o.status, o.restaurant_id, o.timeout_job_id
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.id = ? AND r.owner_id = ?`,
        [orderId, ownerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Order not found or access denied");
        err.status = 404;
        throw err;
    }

    const order = (rows as any[])[0];

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["ready"],
        ready: ["completed"],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(data.status)) {
        const err: any = new Error(
            `Cannot transition from '${order.status}' to '${data.status}'`
        );
        err.status = 400;
        throw err;
    }

    await db.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        [data.status, orderId]
    );

    // Cancel timeout job when order is confirmed
    if (data.status === "confirmed" && order.timeout_job_id) {
        try {
            const job = await orderQueue.getJob(order.timeout_job_id);
            if (job) await job.remove();
        } catch {
            // Job may already be gone — not critical
        }
    }

    // Emit real-time status update
    try {
        const io = getIO();
        io.to(`restaurant_${order.restaurant_id}`).emit("order-status-updated", {
            orderId,
            status: data.status,
        });
    } catch {
        // Not critical
    }

    return { order_id: orderId, status: data.status };
};

// ── Cancel Order (by customer) ────────────────────────────────────────────────
export const cancelOrder = async (
    orderId: number,
    customerId: number
) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT id, status, timeout_job_id FROM orders WHERE id = ? AND customer_id = ?",
        [orderId, customerId]
    );

    if ((rows as any[]).length === 0) {
        const err: any = new Error("Order not found");
        err.status = 404;
        throw err;
    }

    const order = (rows as any[])[0];

    if (!["pending", "confirmed"].includes(order.status)) {
        const err: any = new Error(
            `Cannot cancel an order with status '${order.status}'`
        );
        err.status = 400;
        throw err;
    }

    await db.execute(
        "UPDATE orders SET status = 'cancelled' WHERE id = ?",
        [orderId]
    );

    // Remove timeout job
    if (order.timeout_job_id) {
        try {
            const job = await orderQueue.getJob(order.timeout_job_id);
            if (job) await job.remove();
        } catch {
            // Not critical
        }
    }

    return { order_id: orderId, status: "cancelled" };
};