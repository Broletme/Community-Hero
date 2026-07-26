# Community Hero 🦺

### Hyperlocal Infrastructure Issue Reporting Platform

Community Hero is a civic-tech web app that lets citizens report, verify, and track local infrastructure problems — potholes, broken streetlights, water leaks, garbage — through photo-based reporting powered by AI categorization and real-time collaborative mapping.

Built for the **Vibe2Ship Hackathon** under the *Community Hero: Hyperlocal Problem Solver* problem statement.

\---

## The Problem

Community infrastructure issues go unreported or get lost in fragmented WhatsApp forwards and manual complaint portals. When they do get reported, the same pothole gets submitted 12 times by 12 different people with zero coordination. Nothing gets prioritized. Nothing gets fixed.

## The Solution

Community Hero turns scattered citizen reports into a structured, prioritized issue feed — with one key differentiator: **intelligent duplicate clustering**. When multiple people report the same physical issue (same category, within \~60 meters, within 30 days), the app automatically merges those reports into a single issue with a rising priority count, instead of creating duplicate clutter. The more people report it, the louder it gets.

\---

## Features

* **Photo-based issue reporting** — upload or capture a photo of the problem
* **AI-powered categorization** — Groq Vision (Llama 4 Scout) automatically identifies issue type and severity from the photo
* **Auto geolocation** — captures your coordinates on submit, no manual entry needed
* **Duplicate clustering** — nearby reports of the same issue merge automatically and boost priority
* **Live map view** — color-coded pins (green/amber/red by severity), clustered so one physical issue = one pin
* **Real-time updates** — new reports appear on the map live via Supabase Realtime, no refresh needed
* **Status tracking** — reports move through Reported → Verified → Resolved
* **List/dashboard view** — sortable by severity, status, and verification count

\---

## Tech Stack

|Layer|Technology|
|-|-|
|Framework|Next.js 14 (App Router, TypeScript)|
|Styling|Tailwind CSS|
|Database|Supabase (Postgres)|
|Storage|Supabase Storage|
|Realtime|Supabase Realtime|
|AI Vision|Groq API — `meta-llama/llama-4-scout-17b-16e-instruct`|
|Map|Google Maps JS API (`@vis.gl/react-google-maps`)|
|Icons|Lucide React|
|Deployment|Vercel|

\---

## How It Works

### Report Submission Flow

1. User uploads a photo of a civic issue
2. Browser geolocation captures the user's coordinates automatically
3. The image is uploaded to Supabase Storage (`report-images` bucket) and a public URL is obtained
4. The image is sent (base64) to `/api/categorize` — a Next.js API route that calls Groq Vision
5. Groq returns `{ category, severity, description }` as structured JSON
6. Before inserting, the app calls `find\_nearby\_report` (a Postgres RPC function) to check if a similar issue already exists within \~60 meters
7. **If a match is found**: the new report joins that cluster, `verification\_count` increments on the cluster root, and the user sees *"Merged with an existing report — N people have now reported this"*
8. **If no match**: a fresh standalone report is created and the user sees *"New issue logged"*

### Duplicate Clustering (the differentiator)

The clustering logic lives in the database as a Postgres function using a pure haversine distance formula (no PostGIS extension needed). Reports within 60 meters of each other, sharing the same category, within the last 30 days, are treated as the same physical issue. This means:

* The map shows ONE pin per issue, not N overlapping pins
* Priority is surfaced by `verification\_count` — the badge on a pin tells you how many people have flagged this spot
* Resolved issues are excluded from clustering so old fixed issues don't absorb new reports

### Map View

* Pins are grouped by `cluster\_id` (or their own `id` if standalone) — one pin per unique issue
* Color-coded: 🟢 Low / 🟡 Medium / 🔴 High severity
* Pin badges show verification count when >1
* Clicking a pin shows the photo, AI description, category, status, and a status-change control
* Supabase Realtime subscription keeps the map live — no polling

\---

## Project Structure

```
community-hero/
├── app/
│   ├── api/
│   │   └── categorize/
│   │       └── route.ts        # Groq Vision API route (server-side, key is safe)
│   ├── layout.tsx
│   ├── page.tsx                # Map view (home)
│   └── globals.css
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── reports.ts              # Submit, fetch, cluster, update logic
│   └── types.ts                # Shared TypeScript types
├── supabase/
│   └── schema.sql              # Full DB schema — run this in Supabase SQL Editor
├── .env.local.example          # Env var template (copy to .env.local and fill in)
└── README.md
```

\---

## Getting Started

### Prerequisites

* Node.js 18+
* A [Supabase](https://supabase.com) account (free tier is fine)
* A [Groq](https://console.groq.com) API key (free tier is fine)
* A [Google Cloud](https://console.cloud.google.com) project with the **Maps JavaScript API** enabled

### 1\. Clone the repo

```bash
git clone https://github.com/yourusername/community-hero.git
cd community-hero
```

### 2\. Install dependencies

```bash
npm install
```

### 3\. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in the four values in `.env.local`:

```
NEXT\_PUBLIC\_SUPABASE\_URL=         # Supabase project URL
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=    # Supabase anon/public key
GROQ\_API\_KEY=                     # Groq secret key (server-side only, never sent to browser)
NEXT\_PUBLIC\_GOOGLE\_MAPS\_API\_KEY=  # Google Maps JS API key
```

### 4\. Set up Supabase

* Create a new Supabase project
* Go to **SQL Editor** → paste and run the contents of `supabase/schema.sql`
* Go to **Storage** → create a bucket named `report-images` → toggle **Public bucket** ON

### 5\. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6\. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your four env vars in the Vercel project settings (Settings → Environment Variables) and redeploy.

\---



## 

