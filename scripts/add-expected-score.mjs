import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  // Check if column already exists
  const [rows] = await conn.query("SHOW COLUMNS FROM courses LIKE 'expected_score'");
  if (rows.length > 0) {
    console.log("Column expected_score already exists, skipping.");
  } else {
    await conn.query("ALTER TABLE courses ADD COLUMN expected_score DECIMAL(8,2) NULL");
    console.log("✓ Added expected_score column to courses table");
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await conn.end();
}
