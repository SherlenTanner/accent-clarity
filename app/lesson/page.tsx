import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LessonClient from './LessonClient'
import type { Student, Lesson } from '@/lib/supabase'

export default async function LessonPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Student | null }

   if (!student) redirect('/dashboard')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .single() as { data: Lesson | null }

  return <LessonClient student={student} lesson={lesson} />
}
