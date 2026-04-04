import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function clean() {
  await sql`DELETE FROM planned_sessions`;
  await sql`DELETE FROM weekly_availabilities`;
  await sql`DELETE FROM topics`;
  await sql`DELETE FROM subjects`;
  await sql`DELETE FROM plannings`;
  console.log("Banco limpo com sucesso!");
  await sql.end();
}

clean().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
