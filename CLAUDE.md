# LangSolution Accent Clarity — Project Guide

## Stack
- **Next.js 14.2.5** (App Router), TypeScript, React 18
- **Supabase** (@supabase/ssr 0.5.1, @supabase/supabase-js 2.45.4) for auth + Postgres database
- **No Tailwind** — design uses CSS variables + inline styles (dashboard/login/sidebar are fully inline-styled)
- **Fonts**: DM Sans (UI), Cormorant Garamond (headings), loaded via Google Fonts `<link>` in layout.tsx

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```

## Project Structure
```
app/
  layout.tsx            — Root layout, Google Fonts link, body reset
  page.tsx              — Redirects / → /dashboard
  globals.css           — Full CSS design system (not used by dashboard/login/sidebar which are inline)
  login/page.tsx        — Client component. Email/password login. Inline styled.
  dashboard/page.tsx    — Server component. Student welcome page. Inline styled.
  lesson/page.tsx       — Server component. Fetches student + active lesson.
  lesson/LessonClient.tsx — Client component. Recording UI, avatar animation, AI feedback.
  sounds/page.tsx       — Client component. Sound library with practice words.
  admin/page.tsx        — Server component. Admin data fetching (admin role required).
  admin/AdminClient.tsx — Client component. Student management, lesson editor, feature toggles.
  auth/callback/route.ts — OAuth callback handler.
components/
  Sidebar.tsx           — Client component. Fixed 80px left nav. Inline styled.
lib/
  supabase.ts           — Browser client + TypeScript types (Student, Lesson, Score) + parseMarkup() + splitSentences()
  supabase-server.ts    — Server client using Next.js cookies(). set/remove wrapped in try-catch.
middleware.ts           — Auth guard. Public routes: /login, /auth/*. Uses getUser() not getSession().
supabase/
  schema.sql            — Tables, RLS policies, is_admin() function, seed data.
public/
  sherlen.jpg           — Coach photo displayed on dashboard welcome card.
```

## Auth Flow
1. Unauthenticated user hits any protected route → middleware redirects to `/login`
2. `/login` page calls `signOut()` on mount to clear stale cookies
3. User submits email/password → `signInWithPassword()` → checks student role → redirects to `/dashboard` or `/admin`
4. Middleware validates every request via `supabase.auth.getUser()` (validates JWT with Supabase, not just reads cookie)
5. Server components use `lib/supabase-server.ts` which reads cookies via Next.js `cookies()` hook

## Critical Patterns

### Supabase Clients
- **Browser** (`lib/supabase.ts`): `createBrowserClient()` — used in all `'use client'` components
- **Server** (`lib/supabase-server.ts`): `createServerClient()` with `cookies()` — used in server components
- **Middleware** (`middleware.ts`): `createServerClient()` with request/response cookie handlers
- Server client wraps `set()`/`remove()` in try-catch because Server Components cannot write cookies

### Student Lookup (dashboard)
Dashboard queries `students` by `user_id` first, falls back to `email` match. If found by email with null `user_id`, it backfills `user_id` automatically. This handles pre-seeded rows from schema.sql.

### RLS Policies
- `is_admin()` is a `SECURITY DEFINER` function that bypasses RLS to check admin role — prevents infinite recursion on the students table
- Students can read/update their own row via `user_id` OR `email = auth.email()` (allows claiming pre-seeded rows)
- Admin gets full access on all tables via `is_admin()`

### Sentence Markup
Lessons store sentences with color markup: `[teal]word[/teal]`, `[gold]word[/gold]`, `[red]word[/red]`
- `parseMarkup()` in `lib/supabase.ts` converts to `<span class="hl-teal">` (for CSS-styled pages)
- Dashboard uses local `hlMarkup()` that converts to inline-styled `<strong>` tags

### Inline Styles
Dashboard (`app/dashboard/page.tsx`), Login (`app/login/page.tsx`), and Sidebar (`components/Sidebar.tsx`) use **100% inline styles** with a shared `T` color token object. This was done because globals.css was not being applied reliably. Other pages (lesson, sounds, admin) still use CSS classes from globals.css.

## Design System (Token Object)
```typescript
const T = {
  teal: '#1a7a7a', tealDk: '#145f5f', tealLt: '#e8f5f5', tealMid: '#2a9a9a',
  gold: '#c9a84c', ink: '#1a1a2e', text: '#2d2d2d', muted: '#6b7280',
  border: '#e5e7eb', bg: '#f8fafb', white: '#ffffff',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  font: '"DM Sans", system-ui, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
}
```

## Database Tables
- **students**: id, user_id, name, email, role, profession, location, avatar_initials, avatar_color, status, current_lesson, total_lessons, sessions_count, features (JSONB)
- **lessons**: id, student_id, lesson_number, title, lesson_date, sentences, focus_sounds[], teacher_note, status. UNIQUE(student_id, lesson_number)
- **scores**: id, student_id, lesson_id, lesson_number, lesson_title, overall_score, sounds_scores (JSONB), rhythm_score

## Seed Data
- **Marcos Gutierrez** (marcos@langsolution.com) — Immigration Lawyer, Puerto Rico, student role, lesson 7/20, 6 sessions
- **Sherlen** (sherlen@langsolution.com) — Language Coach, admin role

## Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Start production server
```
