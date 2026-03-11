import dotenv from "dotenv";
dotenv.config();

import fs   from "fs";
import path from "path";
import mysql from "mysql2/promise";

const run = async () => {
  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log("✅ Connected to database");

  // Ensure migrations table exists
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already applied migrations
  const [applied]: any = await connection.execute(
    "SELECT version FROM schema_migrations"
  );
  const appliedVersions = new Set(applied.map((r: any) => r.version));

  // Read all .sql files in this directory, sorted
  const migrationsDir = path.join(__dirname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;

  for (const file of files) {
    const version = file.replace(".sql", "");

    if (appliedVersions.has(version)) {
      console.log(`  ⏭  Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`  🔄 Applying ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await connection.query(sql);
    await connection.execute(
      "INSERT INTO schema_migrations (version) VALUES (?)",
      [version]
    );
    console.log(`  ✅ Applied ${file}`);
    ran++;
  }

  console.log(`\n✅ Done — ${ran} migration(s) applied.`);
  await connection.end();
};

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});