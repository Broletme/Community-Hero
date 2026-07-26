# Community Hero 🦺
### Hyperlocal Infrastructure Issue Reporting Platform

Community Hero is a civic-tech web app that lets citizens report, verify, and track local infrastructure problems — potholes, broken streetlights, water leaks, garbage dumps — through photo-based reporting powered by AI and real-time collaborative mapping.

Built solo for the **Vibe2Ship Hackathon**.

---

## What It Does

You spot a pothole. You open the app, take a photo, and hit submit. The AI automatically figures out what the problem is and how bad it is. Your report drops as a pin on a live map that anyone in your community can see.

If someone else already reported the same pothole nearby, your report doesn't create a duplicate — it merges with theirs and bumps up the priority count. The more people flag the same spot, the louder it gets. That's the whole idea: turn scattered individual complaints into a single, prioritized community voice.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js (TypeScript) |
| Styling | Tailwind CSS |
| Database + Storage + Realtime | Supabase |
| AI Vision | Groq — Llama 4 Scout |
| Map | Google Maps JS API |
| Deployment | Vercel |

---

## How to Run

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Groq API key (free)
- Google Cloud project with Maps JavaScript API enabled

### Setup

```bash
# Clone and install
git clone https://github.com/yourusername/community-hero.git
cd community-hero
npm install

# Add environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, Supabase anon key, Groq API key, Google Maps API key

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy
```bash
vercel
```
Add your four env vars in Vercel project settings and you're live.

---

Built by **Dibu** for Vibe2Ship Hackathon.
