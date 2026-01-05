
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect: "postgresql",
    dbCredentials: {
        url: "postgres://exuser:expass@localhost:5432/exfluential_tools"
    },
});