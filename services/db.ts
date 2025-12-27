/**
 * This file is the "Telephone Line" to the database.
 * It uses the Turso URL and Secret Key to establish a connection.
 */
import { createClient } from "@libsql/client/web";

/**
 * Professional libSQL client initialization.
 * This pattern connects the app to your Turso Cloud Database.
 */
export const db = createClient({
  url: 'https://my-app-sohith-m.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY2NDQ4MjEsImlkIjoiZjVjMzdkNmEtZWRlYi00OTdkLWI0MWQtNGM3NmNlYWM1YTc5IiwicmlkIjoiNzNmMjNiNGQtMzdiOC00MzU0LTk2NGMtZjE4MWJjNjE0ZWFjIn0.POGLJGOAFYar6V2pIofFaqVL1EKWdUu1C1D0vlMWviR5c52YBWV4YC299sbPdjJundS-vw1j3oFZT-LaXGUHBw',
});