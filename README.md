# Split It 💸

A modern expense splitting web app built to make sharing expenses with friends, roommates, and groups simple and hassle-free.

---

## 🚀 Features

- 👥 Create and manage groups
- 💰 Add and split expenses easily
- 📊 Track balances between members
- ⚡ Fast and responsive UI
- ☁️ Powered by Turso Database
- 🔒 Secure environment-based configuration
- 📱 Mobile-friendly design

---

## 🛠️ Tech Stack

- Frontend: React / Next.js
- Backend: Node.js
- Database: Turso (LibSQL)
- Styling: Tailwind CSS
- Deployment: Vercel

---

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 📂 Project Structure

```bash
Split-it/
│
├── app/               # App routes/pages
├── components/        # Reusable UI components
├── lib/               # Utility functions & database setup
├── public/            # Static assets
├── styles/            # Global styles
├── prisma/ or db/     # Database-related files (if applicable)
├── .env.local         # Environment variables
└── package.json
