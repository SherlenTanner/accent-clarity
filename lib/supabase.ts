import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Types
export interface Student {
  id: string
  user_id: string | null
  name: string
  email: string
  role: 'student' | 'admin'
  profession: string | null
  location: string | null
  avatar_initials: string | null
  avatar_color: string
  status: 'active' | 'paused'
  current_lesson: number
  total_lessons: number
  sessions_count: number
  features: {
    personalized_lessons: boolean
    record_feedback: boolean
    sound_library: boolean
    fluency_drills: boolean
  } | null
  created_at: string
}

export interface Lesson {
  id: string
  student_id: string
  lesson_number: number
  title: string | null
  lesson_date: string | null
  sentences: string | null
  focus_sounds: string[] | null
  teacher_note: string | null
  status: 'locked' | 'active' | 'done'
  video_url: string | null
  feedback: string | null
  created_at: string
}

export interface Score {
  id: string
  student_id: string
  lesson_id: string | null
  lesson_number: number
  lesson_title: string | null
  overall_score: number | null
  sounds_scores: Record<string, number>
  rhythm_score: number | null
  created_at: string
}

/** Parse highlight markup into HTML */
export function parseMarkup(text: string): string {
  return text
    .replace(/\[teal\](.*?)\[\/teal\]/g, '<span class="hl-teal">$1</span>')
    .replace(/\[gold\](.*?)\[\/gold\]/g, '<span class="hl-gold">$1</span>')
    .replace(/\[red\](.*?)\[\/red\]/g, '<span class="hl-red">$1</span>')
    .replace(/\[purple\](.*?)\[\/purple\]/g, '<span class="hl-purple">$1</span>')
}

/** Split sentence markup into individual sentences */
export function splitSentences(text: string): string[] {
  return text.split('\n').filter(s => s.trim().length > 0)
}
