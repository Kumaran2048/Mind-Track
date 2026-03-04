# 🧠 MindTrack — Mental Wellness Tracker

<div align="center">

![MindTrack Banner](https://img.shields.io/badge/MindTrack-Wellness%20App-red?style=for-the-badge&logo=heart&logoColor=white)

**A compassionate, private, and intelligent mental wellness tracking application.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-AI%20Powered-orange?style=flat-square)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)

</div>

---

## 📖 About The Project

**MindTrack** is a full-stack mental wellness web application designed to help individuals monitor their emotional health, track substance use patterns, and receive compassionate AI support — all in a safe, private, and non-judgmental environment.

Whether you're managing stress, tracking your mood over time, or just need someone to talk to, MindTrack has you covered.

> ⚠️ **Disclaimer:** MindTrack is not a substitute for professional mental health care. If you are in crisis, please contact a qualified professional or use the Emergency Resources page in the app.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **Mira AI Chat** | Chat with Mira, your compassionate AI wellness companion powered by Llama 3.1 via Groq |
| 📅 **Mood Heatmap Calendar** | Visualize your mood history in a GitHub-style contribution calendar |
| ✍️ **Daily Mood Log** | Log your daily mood score, substances, quantity, and journal thoughts |
| 📊 **Insights & Analytics** | See charts and trends in your emotional data over time |
| 📋 **History View** | Browse all your past mood entries in one place |
| 🔥 **Streak Tracker** | Stay motivated with daily activity streaks |
| 🆘 **Emergency Resources** | Instant access to mental health crisis hotlines and resources |
| 🔒 **Private & Secure** | Row-Level Security (RLS) ensures only you can see your data |

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org)** — React framework with App Router
- **[React 19](https://react.dev)** — UI library
- **[Tailwind CSS 4](https://tailwindcss.com)** — Styling
- **[Lucide React](https://lucide.dev)** — Icons
- **[next-themes](https://github.com/pacocoursey/next-themes)** — Dark/Light mode

### Backend & Database
- **[Supabase](https://supabase.com)** — Authentication, PostgreSQL database, Row Level Security
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** — Backend API endpoints

### AI
- **[Groq](https://groq.com)** — Ultra-fast inference
- **[Llama 3.1 8B Instant](https://groq.com/models)** — The AI model powering Mira

---

## 📁 Project Structure

```
mindtrack/
├── app/
│   ├── api/
│   │   └── chat/          # Mira AI API route
│   ├── auth/
│   │   ├── login/         # Login page
│   │   └── signup/        # Sign up page
│   ├── calendar/          # Mood heatmap calendar
│   ├── dashboard/         # Main dashboard
│   ├── emergency/         # Crisis resources
│   ├── history/           # Past mood entries
│   ├── insights/          # Analytics & charts
│   ├── logs/              # Daily mood logging
│   ├── mira/              # AI chat companion
│   └── profile/           # User profile settings
├── lib/
│   └── supabase/          # Supabase client helpers
├── scripts/
│   ├── 001_create_tables.sql      # Profiles & mood_logs tables
│   ├── 002_profile_trigger.sql    # Auto-create profile on signup
│   ├── 003_create_chat_messages.sql  # Chat history table
│   └── 004_create_streaks.sql     # Streaks table
└── .env.local             # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [npm](https://npmjs.com)
- A [Supabase](https://supabase.com) account (free)
- A [Groq](https://console.groq.com) account (free)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mindtrack.git
cd mindtrack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Set Up the Supabase Database

Go to your **[Supabase SQL Editor](https://supabase.com/dashboard)** and run each of the SQL files in the `scripts/` folder in order:

1. `001_create_tables.sql`
2. `002_profile_trigger.sql`
3. `003_create_chat_messages.sql`
4. `004_create_streaks.sql`

### 5. Run the Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Getting Your API Keys

### Supabase (Free)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Find your URL and keys in **Project Settings → API**

### Groq API (Free, No Billing Required)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google
3. Click **API Keys → Create API Key**
4. Copy the key (starts with `gsk_...`)

---

## 📸 Pages Overview

### 🏠 Dashboard
Your main hub showing today's mood summary, active streaks, and quick navigation to all features.

### 💬 Mira Chat
A conversational AI wellness companion. Talk to Mira about anything — she's warm, supportive, and always available.

### 📅 Mood Calendar
A beautiful heatmap calendar showing your mood history at a glance, similar to a GitHub contribution graph.

### ✍️ Mood Log
Log your daily emotional state with a mood score (0–10), substances used, and a personal journal entry.

### 📊 Insights
Charts and analysis of your mood trends, patterns, and correlations over time.

### 📋 History
A chronological list of all your mood entries with full details.

### 🆘 Emergency
Quick access to mental health crisis helplines and resources.

---

## 🔒 Privacy & Security

- All user data is protected by **Supabase Row Level Security (RLS)**
- Users can only access their own data — no one else can see your logs
- No data is shared with third parties
- The Groq AI API only receives the text of your message — no personal information

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💙 Acknowledgements

- [Groq](https://groq.com) for ultra-fast free AI inference
- [Supabase](https://supabase.com) for the amazing free database backend
- [Next.js](https://nextjs.org) for the powerful React framework
- [Lucide Icons](https://lucide.dev) for beautiful icons
- Mental health professionals worldwide for their tireless work

---

<div align="center">
Made with ❤️ for mental wellness
</div>
