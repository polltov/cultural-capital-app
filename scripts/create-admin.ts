import { config } from "dotenv";
config({ path: ".env.local" });

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "@/src/db/client";
import { createAdmin, findAdminByEmail } from "@/src/db/queries/admins";
import { hashPassword } from "@/src/auth/password";

(async () => {
  const rl = readline.createInterface({ input, output });
  const email = (await rl.question("email: ")).trim().toLowerCase();
  const password = (await rl.question("password (min 8): ")).trim();
  rl.close();
  if (password.length < 8) {
    console.error("password too short");
    process.exit(1);
  }
  const d = db();
  if (await findAdminByEmail(d, email)) {
    console.error("admin already exists");
    process.exit(1);
  }
  const hash = await hashPassword(password);
  const a = await createAdmin(d, email, hash);
  console.log("created", a.id);
  process.exit(0);
})();
