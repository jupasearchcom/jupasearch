import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  // Check if column already exists
  const [existing] = await conn.execute('SHOW COLUMNS FROM courses LIKE "expectedScore"');
  if (existing.length > 0) {
    console.log('✓ expectedScore column already exists');
  } else {
    await conn.execute('ALTER TABLE `courses` ADD `expectedScore` decimal(6,2)');
    console.log('✓ expectedScore column added successfully');
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await conn.end();
}
