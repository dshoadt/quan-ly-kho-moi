import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123123@127.0.0.1:5432/warehouse_db";

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
