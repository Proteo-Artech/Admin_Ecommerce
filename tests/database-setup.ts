import { execFileSync } from "node:child_process";
import path from "node:path";

export default function setup() {
  execFileSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"], { env: process.env, stdio: "pipe" });
}
