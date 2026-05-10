import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LessonClient from './LessonClient'
import type { Student, Lesson } from '@/lib/supabase'

export default async function LessonPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find the logged-in person's record
  const { data: me } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Student | null }

  if (!me) redirect('/dashboard')

  // If admin is viewing, load the first student's active lesson (Marcos for now).
  // If a student is viewing, load their own active lesson.
  let studentForLesson: Student = me

  if (me.role === 'admin') {
    const { data: firstStudent } = await supabase
      .from('students')
      .select('*')
      .eq('role', 'student')
      .order('name')
      .limit(1)
      .single() as { data: Student | null }

    if (firstStudent) {
      studentForLesson = firstStudent
    }
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentForLesson.id)
    .eq('status', 'active')
    .single() as { data: Lesson | null }

  return <LessonClient student={studentForLesson} lesson={lesson} />
}
