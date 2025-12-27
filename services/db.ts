
/**
 * This file is the "Telephone Line" to the database.
 * It uses the Turso URL and Secret Key from environment variables.
 */
import { createClient } from "@libsql/client/web";

/**
 * Professional libSQL client initialization.
 * This pattern connects the app to your Turso Cloud Database using secure env variables.
 * Make sure TURSO_URL and TURSO_AUTH_TOKEN are set in your Vercel Project Settings.
 */
export const db = createClient({
  url: process.env.TURSO_URL || 'https://my-app-sohith-m.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});
