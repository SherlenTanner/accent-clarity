import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LessonClient from './LessonClient'
import type { Student, Lesson } from '@/lib/supabase'

export default async function LessonPage({
  searchParams,
}: {
  searchParams: { n?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find student record (by user_id, falling back to email)
  const byId = await supabase
    .from('students').select('*').eq('user_id', user.id).maybeSingle()
  const byEmail = !byId.data && user.email
    ? await supabase.from('students').select('*').eq('email', user.email).maybeSingle()
    : { data: null }
  let student = (byId.data ?? byEmail.data) as Student | null

  // Backfill user_id if missing
  if (student && !student.user_id) {
    await supabase.from('students').update({ user_id: user.id }).eq('id', student.id)
    student = { ...student, user_id: user.id }
  }

  if (!student) {
    return <div style={{ padding: '2rem' }}>Profile not found. Please contact Sherlen.</div>
  }

  // Decide which lesson to load:
  // - If URL has ?n=X, load that specific lesson number
  // - Otherwise, load the student's active lesson
  const requestedNum = searchParams?.n ? parseInt(searchParams.n, 10) : null
  const useRequested = requestedNum !== null && !isNaN(requestedNum) && requestedNum > 0

  let lesson: Lesson | null = null

  if (useRequested) {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .eq('lesson_number', requestedNum)
      .maybeSingle() as { data: Lesson | null }
    lesson = data
  } else {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'active')
      .maybeSingle() as { data: Lesson | null }
    lesson = data
  }

  return <LessonClient student={student} lesson={lesson} />
}
