import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EditorClient from './EditorClient'
import type { Student, Lesson } from '@/lib/supabase'

export default async function AdminEditorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Student | null }

  if (!me || me.role !== 'admin') redirect('/dashboard')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('role', 'student')
    .order('name') as { data: Student[] | null }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number') as { data: Lesson[] | null }

  return (
    <EditorClient
      students={students ?? []}
      lessons={lessons ?? []}
    />
  )
}
