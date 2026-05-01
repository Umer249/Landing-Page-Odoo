# Odoo UAE Google Ads Landing Page

Mobile-first landing page inspired by Odoo's visual language, with:

- Lead capture form above the fold
- Social proof and industry sections
- Product screen visuals
- 4-step "How it works"
- Admin panel to view/export form submissions
- Lead data persisted in Supabase

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create Supabase table:

   - Run `supabase/001_create_leads_table.sql` in your Supabase SQL editor.

3. Configure environment:

   - Copy `.env.example` to `.env`
   - Set:
     - `ADMIN_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (preferred) **or** `SUPABASE_ANON_KEY`
     - `SUPABASE_LEADS_TABLE` (default `leads`)
   - Optional: set `WEBHOOK_URL` and SMTP values for email notifications

4. Start:

   ```bash
   npm start
   ```

5. Open:

   - Landing page: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

## Admin panel authentication

Use the same `ADMIN_KEY` value in the admin page key field to load submissions.
