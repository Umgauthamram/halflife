import { createTelegraphClient } from "@half-life/telegraph";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const c = createTelegraphClient();
  const intents = await c.listIntents();
  console.log("Intents found:", intents);
  for (const i of intents) {
    const miners = await c.listMiners(i);
    console.log(`Intent [${i}] miners (${miners.length}):`, miners);
  }
}

main().catch(console.error);
