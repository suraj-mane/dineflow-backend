import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db }    from "../../config/database";
import redis      from "../../config/redis";
import { CreateRestaurantInput, UpdateRestaurantInput } from "./restaurant.types";

// ── Create Restaurant ─────────────────────────────────────────────────────────
export const createRestaurant = async (
  data:    CreateRestaurantInput,
  ownerId: number
) => {
  const {
    name,
    descriptions  = null,
    phone         = null,
    address       = null,
    city          = null,
    state         = null,
    postal_code   = null,
    latitude      = null,
    longitude     = null,
    tax_percentage = null,
  } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert restaurant
    const [restaurantResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO restaurants (owner_id, name, descriptions, phone)
       VALUES (?, ?, ?, ?)`,
      [ownerId, name, descriptions, phone]
    );
    const restaurantId = restaurantResult.insertId;

    // 2. Insert location
    await connection.execute(
      `INSERT INTO restaurant_locations
       (restaurant_id, address, city, state, postal_code, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, address, city, state, postal_code, latitude, longitude]
    );

    // 3. Insert settings
    await connection.execute(
      `INSERT INTO restaurant_settings
       (restaurant_id, is_open, accepting_orders, currency, tax_percentage)
       VALUES (?, TRUE, TRUE, 'INR', ?)`,
      [restaurantId, tax_percentage]
    );

    // 4. Insert stats
    await connection.execute(
      `INSERT INTO restaurant_stats (restaurant_id, rating, total_orders)
       VALUES (?, 0, 0)`,
      [restaurantId]
    );

    await connection.commit();

    return { id: restaurantId, name };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── List Owner Restaurants ────────────────────────────────────────────────────
export const getOwnerRestaurants = async (
  ownerId: number,
  page:    number,
  limit:   number
) => {
  const safePage  = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const offset    = (safePage - 1) * safeLimit;

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       r.id, r.name, r.descriptions, r.phone, r.status,
       l.city, l.state,
       s.is_open, s.accepting_orders,
       stats.rating, stats.total_orders
     FROM restaurants r
     LEFT JOIN restaurant_locations l    ON r.id = l.restaurant_id
     LEFT JOIN restaurant_settings  s    ON r.id = s.restaurant_id
     LEFT JOIN restaurant_stats     stats ON r.id = stats.restaurant_id
     WHERE r.owner_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
      [ownerId, String(safeLimit), String(offset)]
  );

  const [[countRow]] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM restaurants WHERE owner_id = ?",
    [ownerId]
  );

  return {
    data: rows,
    pagination: {
      page:  safePage,
      limit: safeLimit,
      total: (countRow as any).total,
      pages: Math.ceil((countRow as any).total / safeLimit),
    },
  };
};

// ── Get Single Restaurant ─────────────────────────────────────────────────────
export const getRestaurantById = async (
  restaurantId: number,
  ownerId:      number
) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       r.id, r.name, r.descriptions, r.phone, r.status,
       l.address, l.city, l.state, l.postal_code, l.latitude, l.longitude,
       s.is_open, s.accepting_orders, s.currency, s.tax_percentage,
       stats.rating, stats.total_orders
     FROM restaurants r
     LEFT JOIN restaurant_locations l    ON r.id = l.restaurant_id
     LEFT JOIN restaurant_settings  s    ON r.id = s.restaurant_id
     LEFT JOIN restaurant_stats     stats ON r.id = stats.restaurant_id
     WHERE r.id = ? AND r.owner_id = ?`,
    [restaurantId, ownerId]
  );

  if ((rows as any[]).length === 0) {
    const err: any = new Error("Restaurant not found");
    err.status = 404;
    throw err;
  }

  return rows[0];
};

// ── Update Restaurant ─────────────────────────────────────────────────────────
export const updateRestaurant = async (
  restaurantId: number,
  ownerId:      number,
  data:         UpdateRestaurantInput
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify ownership
    const [check] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM restaurants WHERE id = ? AND owner_id = ?",
      [restaurantId, ownerId]
    );
    if ((check as any[]).length === 0) {
      const err: any = new Error("Restaurant not found or access denied");
      err.status = 404;
      throw err;
    }

    // Update restaurants table
    const rFields: string[] = [];
    const rValues: any[]    = [];
    if (data.name)         { rFields.push("name = ?");         rValues.push(data.name); }
    if (data.descriptions) { rFields.push("descriptions = ?"); rValues.push(data.descriptions); }
    if (data.phone)        { rFields.push("phone = ?");        rValues.push(data.phone); }

    if (rFields.length > 0) {
      await connection.execute(
        `UPDATE restaurants SET ${rFields.join(", ")} WHERE id = ?`,
        [...rValues, restaurantId]
      );
    }

    // Update restaurant_locations table
    const lFields: string[] = [];
    const lValues: any[]    = [];
    if (data.address)     { lFields.push("address = ?");     lValues.push(data.address); }
    if (data.city)        { lFields.push("city = ?");        lValues.push(data.city); }
    if (data.state)       { lFields.push("state = ?");       lValues.push(data.state); }
    if (data.postal_code) { lFields.push("postal_code = ?"); lValues.push(data.postal_code); }
    if (data.latitude)    { lFields.push("latitude = ?");    lValues.push(data.latitude); }
    if (data.longitude)   { lFields.push("longitude = ?");   lValues.push(data.longitude); }

    if (lFields.length > 0) {
      await connection.execute(
        `UPDATE restaurant_locations SET ${lFields.join(", ")} WHERE restaurant_id = ?`,
        [...lValues, restaurantId]
      );
    }

    // Update restaurant_settings table
    const sFields: string[] = [];
    const sValues: any[]    = [];
    if (data.tax_percentage   !== undefined) { sFields.push("tax_percentage = ?");   sValues.push(data.tax_percentage); }
    if (data.is_open          !== undefined) { sFields.push("is_open = ?");          sValues.push(data.is_open); }
    if (data.accepting_orders !== undefined) { sFields.push("accepting_orders = ?"); sValues.push(data.accepting_orders); }

    if (sFields.length > 0) {
      await connection.execute(
        `UPDATE restaurant_settings SET ${sFields.join(", ")} WHERE restaurant_id = ?`,
        [...sValues, restaurantId]
      );
    }

    await connection.commit();

    // Invalidate menu cache
    await redis.del(`restaurant_menu_${restaurantId}`);

    return { success: true };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getRestaurantDashboard = async (
  restaurantId: number,
  ownerId:      number
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

  // Run all queries in parallel
  const [
    [totalRow],
    [todayRow],
    [revenueRow],
    [topItems],
  ] = await Promise.all([
    db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total_orders FROM orders WHERE restaurant_id = ?",
      [restaurantId]
    ),
    db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as today_orders FROM orders
       WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()`,
      [restaurantId]
    ),
    db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
       FROM orders WHERE restaurant_id = ? AND status = 'completed'`,
      [restaurantId]
    ),
    db.execute<RowDataPacket[]>(
      `SELECT m.name, SUM(oi.quantity) as total_sold
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN orders     o ON oi.order_id     = o.id
       WHERE o.restaurant_id = ?
       GROUP BY m.id, m.name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [restaurantId]
    ),
  ]);

  return {
    total_orders:      (totalRow   as any[])[0].total_orders,
    today_orders:      (todayRow   as any[])[0].today_orders,
    total_revenue:     (revenueRow as any[])[0].total_revenue,
    top_selling_items: topItems,
  };
};

// ── Get Restaurant Menu (with Redis cache) ────────────────────────────────────
export const getRestaurantMenu = async (restaurantId: number) => {
  const cacheKey = `restaurant_menu_${restaurantId}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query DB
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       m.id, m.name, m.price, m.description,
       m.image_url, m.is_available,
       c.name as category
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.restaurant_id = ?
     ORDER BY c.display_order, m.name`,
    [restaurantId]
  );

  // Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(rows), "EX", 300);

  return rows;
};