import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { name, email, profession, location } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  // Create auth user and send invite email
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name }
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const userId = authData.user.id
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['#1a7a7a', '#2d6a9f', '#7a4a9a', '#9a6a2a', '#4a7a4a']
  const avatarColor = colors[Math.floor(Math.random() * colors.length)]

  // Create student record
  const { error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      user_id: userId,
      name,
      email,
      role: 'student',
      profession: profession || '',
      location: location || '',
      avatar_initials: initials,
      avatar_color: avatarColor,
      status: 'active',
      current_lesson: 1,
      total_lessons: 20,
      sessions_count: 0,
      features: {
        personalized_lessons: true,
        record_feedback: true,
        sound_library: true,
        fluency_skills: false,
        avatar_shadowing: true,
        progress_tracker: true,
      }
    })
  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 })

  // Get the new student id
  const { data: newStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!newStudent) return NextResponse.json({ error: 'Student not found after insert' }, { status: 500 })

  // Create 20 locked lessons
  const lessons = Array.from({ length: 20 }, (_, i) => ({
    student_id: newStudent.id,
    lesson_number: i + 1,
    title: '',
    lesson_date: '',
    sentences: '',
    teacher_note: '',
    focus_sounds: [],
    status: i === 0 ? 'active' : 'locked',
  }))

  const { error: lessonsError } = await supabaseAdmin.from('lessons').insert(lessons)
  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 })

  return NextResponse.json({ success: true, name })
}