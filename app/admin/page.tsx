import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminClient from './AdminClient'
import type { Student, Lesson, Score } from '@/lib/supabase'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('students')
    .select('role, name')
    .eq('user_id', user.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') redirect('/dashboard')

  // Fetch all students (not admin accounts)
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: true }) as { data: Student[] | null }

  // Fetch all lessons
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number', { ascending: true }) as { data: Lesson[] | null }

  // Fetch all scores
  const { data: allScores } = await supabase
    .from('scores')
    .select('*')
    .order('lesson_number', { ascending: true }) as { data: Score[] | null }

  // Compute avg score per student
  const studentScores: Record<string, number> = {}
  ;(allScores ?? []).forEach(s => {
    if (!studentScores[s.student_id]) studentScores[s.student_id] = 0
    studentScores[s.student_id] = Math.round(
      (allScores ?? [])
        .filter(x => x.student_id === s.student_id && x.overall_score != null)
        .reduce((sum, x) => sum + (x.overall_score ?? 0), 0) /
      Math.max(
        (allScores ?? []).filter(x => x.student_id === s.student_id && x.overall_score != null).length,
        1
      )
    )
  })

  const totalLessonsBuilt = (allLessons ?? []).filter(l => l.sentences && l.sentences.length > 0).length
  const pausedCount       = (students ?? []).filter(s => s.status === 'paused').length
  const overallAvg        = Object.values(studentScores).length
    ? Math.round(Object.values(studentScores).reduce((a, b) => a + b, 0) / Object.values(studentScores).length)
    : 0

  return (
    <AdminClient
      students={students ?? []}
      allLessons={allLessons ?? []}
      allScores={allScores ?? []}
      studentScores={studentScores}
      stats={{ activeStudents: (students ?? []).filter(s => s.status === 'active').length, totalLessonsBuilt, avgScore: overallAvg, onPause: pausedCount }}
      adminName={adminUser.name}
    />
  )
}
