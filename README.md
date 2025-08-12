# SpendWise (Scaffold)

Mobile-first expense tracker scaffold built with Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, Storage) + Vercel.

## Quick start

1. **Create a Supabase project**, then copy Project URL + anon key + service role key.
2. `cp .env.example .env.local` and fill values.
3. In Supabase SQL Editor, run the contents of `/supabase/schema.sql`.
4. Create private Storage buckets `receipts` and `exports` (or run the SQL commented at the bottom of the schema).
5. In Supabase **Auth → Providers**, enable **Email** and **GitHub**. Set redirect URL to `NEXT_PUBLIC_SITE_URL` + `/auth/callback`.
6. Install deps: `npm i`
7. Dev: `npm run dev` → http://localhost:3000

## Deploy (Vercel)

- Push to GitHub → Import project in Vercel → set the same env vars as in `.env.local`.
- Never expose the Service Role to the client.

## Notes

- Expenses support a configurable currency (default **AUD**, with **NZD** enabled). Add others in profile settings JSON.
- Exports create a ZIP with CSV + a simple PDF summary + included receipts; exports are stored in a **private** Storage bucket.
- This is a scaffold; refine validation, error handling, and UI as needed.