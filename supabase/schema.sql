-- ============================================================
-- LangSolution Accent Clarity — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Students table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS students (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT UNIQUE NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student',  -- 'student' or 'admin'
  profession     TEXT,
  location       TEXT,
  avatar_initials TEXT,
  avatar_color   TEXT DEFAULT '#1a7a7a',
  status         TEXT NOT NULL DEFAULT 'active',   -- 'active' or 'paused'
  current_lesson INT NOT NULL DEFAULT 1,
  total_lessons  INT NOT NULL DEFAULT 20,
  sessions_count INT NOT NULL DEFAULT 0,
  features       JSONB NOT NULL DEFAULT '{
    "personalized_lessons": true,
    "record_feedback": true,
    "sound_library": true,
    "fluency_skills": false,
    "avatar_shadowing": true,
    "progress_tracker": true
  }',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons table (one row per student per lesson number)
CREATE TABLE IF NOT EXISTS lessons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_number  INT NOT NULL,
  title          TEXT,
  lesson_date    TEXT,
  sentences      TEXT,  -- markup: [teal]...[/teal], [gold]...[/gold], [red]...[/red]
  focus_sounds   TEXT[] NOT NULL DEFAULT '{}',
  teacher_note   TEXT,
  status         TEXT NOT NULL DEFAULT 'locked',   -- 'locked', 'active', 'done'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, lesson_number)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id      UUID REFERENCES lessons(id) ON DELETE SET NULL,
  lesson_number  INT NOT NULL,
  lesson_title   TEXT,
  overall_score  INT,
  sounds_scores  JSONB NOT NULL DEFAULT '{}',  -- e.g. {"/θ/": 68, "/ð/": 84, "/r/": 71}
  rhythm_score   INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores   ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin() reads the students table bypassing RLS so it can be used
-- inside policies on the same table without triggering infinite recursion.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Students: users can read/update their own record (by user_id OR matching email,
-- so a freshly-created auth user can find and claim their pre-seeded row);
-- admins can read/update all.
CREATE POLICY "Students: self read"
  ON students FOR SELECT
  USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Students: admin full access"
  ON students FOR ALL
  USING (is_admin());

CREATE POLICY "Students: self update"
  ON students FOR UPDATE
  USING (auth.uid() = user_id OR email = auth.email());

-- Lessons: students can read their own; admins can do everything
CREATE POLICY "Lessons: student read own"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = lessons.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Lessons: admin full access"
  ON lessons FOR ALL
  USING (is_admin());

-- Scores: students read own; admins full access
CREATE POLICY "Scores: student read own"
  ON scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = scores.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Scores: admin full access"
  ON scores FOR ALL
  USING (is_admin());

CREATE POLICY "Scores: student insert own"
  ON scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = scores.student_id AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- SEED DATA
-- ============================================================
-- NOTE: Run the auth user creation first in Supabase Dashboard
-- (Authentication > Users > Invite / Create user), then paste
-- the returned user UUIDs in the INSERT statements below.
--
-- Suggested accounts:
--   marcos@langsolution.com  / AccentClarity2026!
--   sherlen@langsolution.com / AdminSherlen2026!
-- ============================================================

-- Step 1: Create auth users via Supabase Dashboard or Auth API,
--         then replace the UUIDs below with the actual user IDs.

-- Step 2: Insert student records

INSERT INTO students (user_id, name, email, role, profession, location, avatar_initials, avatar_color, status, current_lesson, total_lessons, sessions_count)
VALUES
  (
    NULL, -- replace with Marcos's auth.users UUID after creating his account
    'Marcos Gutierrez',
    'marcos@langsolution.com',
    'student',
    'Immigration Lawyer',
    'Puerto Rico',
    'MG',
    '#1a7a7a',
    'paused',
    7,
    20,
    6
  ),
  (
    NULL, -- replace with Sherlen's auth.users UUID
    'Sherlen',
    'sherlen@langsolution.com',
    'admin',
    'Language Coach',
    NULL,
    'SH',
    '#5b21b6',
    'active',
    0,
    0,
    0
  )
ON CONFLICT (email) DO NOTHING;

-- Step 3: Insert Marcos's lessons (run after student record is created)
-- Get Marcos's student ID first:
-- SELECT id FROM students WHERE email = 'marcos@langsolution.com';

DO $$
DECLARE
  marcos_id UUID;
BEGIN
  SELECT id INTO marcos_id FROM students WHERE email = 'marcos@langsolution.com';

  IF marcos_id IS NOT NULL THEN

    -- Lessons 1-6: DONE
    INSERT INTO lessons (student_id, lesson_number, title, lesson_date, sentences, focus_sounds, teacher_note, status) VALUES
    (marcos_id, 1, 'Introduction to Accent Clarity', 'March 5, 2026',
     E'Welcome to your first lesson, [gold]Marcos[/gold]. We start by identifying [teal]the[/teal] sounds that need your focus.\nYour goal is to speak with [teal]clarity[/teal] and [gold]confidence[/gold] in every legal setting.\nListen carefully to [teal]the[/teal] difference between your current pronunciation and [teal]the[/teal] target sounds.\nPractice makes progress — [red]not[/red] perfection.',
     ARRAY['/θ/', '/r/'], 'Great first session, Marcos! You have a strong foundation to build on.', 'done'),

    (marcos_id, 2, 'The TH Sound — Basics', 'March 8, 2026',
     E'[teal]The[/teal] most important sound in English legal speech is [teal]the[/teal] TH.\nPractice saying "[teal]the[/teal] court", "[teal]the[/teal] law", "[teal]the[/teal] judge" — slowly at first.\n[red]Think[/red] of [teal]the[/teal] tongue touching your upper teeth gently as you speak.\nEvery [gold]attorney[/gold] must master [teal]this[/teal] fundamental sound.',
     ARRAY['/θ/', '/ð/'], 'Your tongue placement for TH is improving. Keep practicing the voiceless version.', 'done'),

    (marcos_id, 3, 'Legal Vocabulary — Clarity', 'March 12, 2026',
     E'[gold]Immigration law[/gold] requires precision — [teal]the[/teal] words you choose define your case.\nSay "[teal]therefore[/teal]" and "[teal]threshold[/teal]" slowly, feeling [teal]the[/teal] TH at [teal]the[/teal] start.\n[red]There[/red] is a difference between "[gold]law[/gold]" and "[teal]the[/teal] law" — [teal]the[/teal] article matters.\nYour [gold]client[/gold] deserves an advocate who speaks with full [teal]clarity[/teal].',
     ARRAY['/θ/', '/ð/', '/r/'], 'Excellent progress on legal vocabulary. Your /r/ blend is much smoother.', 'done'),

    (marcos_id, 4, 'Rhythm and Flow', 'March 17, 2026',
     E'English has a natural [gold]rhythm[/gold] — stress falls on [teal]the[/teal] most important words.\n[red]Don''t[/red] stress every word equally — let [teal]the[/teal] key nouns and verbs carry [teal]the[/teal] weight.\nIn "[gold]immigration[/gold] court", [teal]the[/teal] stress lands on "[gold]IM[/gold]-mi-gra-tion" and "[gold]COURT[/gold]".\n[teal]The[/teal] more natural your rhythm, [teal]the[/teal] more persuasive you sound.',
     ARRAY['/r/', '/θ/'], 'Beautiful improvement in sentence rhythm. The courtroom exercises really helped.', 'done'),

    (marcos_id, 5, 'The R Sound in Legal Terms', 'March 22, 2026',
     E'[teal]The[/teal] American /r/ is curved — [teal]the[/teal] tongue curls back, [red]never[/red] touching [teal]the[/teal] roof.\nPractice: "[gold]representation[/gold]", "[teal]rights[/teal]", "[gold]resolution[/gold]", "[teal]review[/teal]".\n[teal]The[/teal] key is to keep [teal]the[/teal] /r/ strong even in [gold]unstressed[/gold] syllables.\n"I [teal]represent[/teal] my client in [teal]the[/teal] matter of [gold]residency[/gold] rights."',
     ARRAY['/r/', '/θ/'], 'Your /r/ in stressed syllables is excellent. Now work on carrying it through unstressed ones.', 'done'),

    (marcos_id, 6, 'Speaking Under Pressure', 'March 28, 2026',
     E'[gold]Courtroom speech[/gold] requires composure — [teal]the[/teal] ability to slow down when it matters.\nWhen [teal]the[/teal] judge asks a question, [red]pause[/red] before you answer — collect [teal]the[/teal] sounds.\n"[teal]The[/teal] evidence [gold]clearly[/gold] shows [teal]that[/teal] my client [teal]has[/teal] met all [teal]the[/teal] requirements."\n[teal]Three[/teal] seconds of silence is [gold]powerful[/gold] — [red]not[/red] a weakness.',
     ARRAY['/θ/', '/ð/', '/r/'], 'This was your best session yet. Your composure under pressure has grown significantly.', 'done'),

    -- Lesson 7: ACTIVE (current)
    (marcos_id, 7, 'Courtroom Communication', 'April 9, 2026',
     E'[teal]There''s[/teal] a moment every [gold]immigration lawyer[/gold] knows — whether [teal]the[/teal] judge can actually hear you.\nYou need to say [teal]the[/teal] word "[teal]threshold[/teal]" clearly — [red]not[/red] "treshold" or "dreshold".\nWhen [teal]the[/teal] courtroom goes quiet, your pronunciation carries more weight [red]than[/red] your argument.\nEvery [gold]attorney[/gold] must be able to articulate [teal]the[/teal] charges and [teal]the[/teal] facts with [teal]clarity[/teal].',
     ARRAY['/θ/', '/r/', '/ð/'],
     'Marcos — your /r/ has improved a lot since our last session. This week let''s focus on nailing the /θ/ sound, especially in "the", "therefore", and "threshold". These words come up constantly in court. Take it slow and think about touching your tongue to your upper teeth.',
     'active');

    -- Lessons 8-20: LOCKED (no content yet)
    INSERT INTO lessons (student_id, lesson_number, title, focus_sounds, status) VALUES
    (marcos_id, 8,  'Cross-Examination Speech',   ARRAY['/θ/', '/ð/'], 'locked'),
    (marcos_id, 9,  'Persuasion and Tone',        ARRAY['/r/'],        'locked'),
    (marcos_id, 10, 'Closing Arguments',          ARRAY['/θ/', '/r/'], 'locked'),
    (marcos_id, 11, 'Client Consultation',        ARRAY['/ð/'],        'locked'),
    (marcos_id, 12, 'Opening Statements',         ARRAY['/θ/', '/ð/'], 'locked'),
    (marcos_id, 13, 'Witness Examination',        ARRAY['/r/'],        'locked'),
    (marcos_id, 14, 'Legal Motions',              ARRAY['/θ/'],        'locked'),
    (marcos_id, 15, 'Deportation Hearings',       ARRAY['/θ/', '/r/'], 'locked'),
    (marcos_id, 16, 'Asylum Cases',               ARRAY['/ð/', '/r/'], 'locked'),
    (marcos_id, 17, 'Appeals Court',              ARRAY['/θ/', '/ð/'], 'locked'),
    (marcos_id, 18, 'Naturalization Ceremonies',  ARRAY['/r/'],        'locked'),
    (marcos_id, 19, 'Media and Public Speaking',  ARRAY['/θ/', '/r/'], 'locked'),
    (marcos_id, 20, 'Graduation — Final Review',  ARRAY['/θ/', '/ð/', '/r/'], 'locked')
    ON CONFLICT (student_id, lesson_number) DO NOTHING;

    -- Insert score history for lessons 1-6
    INSERT INTO scores (student_id, lesson_number, lesson_title, overall_score, sounds_scores, rhythm_score)
    SELECT marcos_id, l.lesson_number, l.title,
      CASE l.lesson_number WHEN 1 THEN 65 WHEN 2 THEN 70 WHEN 3 THEN 74 WHEN 4 THEN 78 WHEN 5 THEN 81 WHEN 6 THEN 85 END,
      CASE l.lesson_number
        WHEN 1 THEN '{"\/θ\/": 60, "\/r\/": 68}'::jsonb
        WHEN 2 THEN '{"\/θ\/": 65, "\/ð\/": 72}'::jsonb
        WHEN 3 THEN '{"\/θ\/": 69, "\/ð\/": 75, "\/r\/": 72}'::jsonb
        WHEN 4 THEN '{"\/r\/": 78, "\/θ\/": 74}'::jsonb
        WHEN 5 THEN '{"\/r\/": 82, "\/θ\/": 79}'::jsonb
        WHEN 6 THEN '{"\/θ\/": 84, "\/ð\/": 86, "\/r\/": 83}'::jsonb
      END,
      CASE l.lesson_number WHEN 1 THEN 72 WHEN 2 THEN 75 WHEN 3 THEN 79 WHEN 4 THEN 84 WHEN 5 THEN 86 WHEN 6 THEN 88 END
    FROM lessons l
    WHERE l.student_id = marcos_id AND l.lesson_number BETWEEN 1 AND 6;

  END IF;
END $$;
