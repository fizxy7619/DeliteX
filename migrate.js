const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  "postgresql://postgres:1912Divyanshu%40@db.gjplhxapivuviejlsurj.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const sqlPath = path.join(
      __dirname,
      "supabase",
      "migrations",
      "001_create_waitlist.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing SQL migration...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

runMigration();
