'use client'

import { useState } from 'react'
import type { Student, Lesson } from '@/lib/supabase'

export default function EditorClient({
  students,
  lessons,
}: {
  students: Student[]
  lessons: Lesson[]
}) {
  const [studentId, setStudentId] = useState<string>('')
  const [lessonId, setLessonId] = useState<string>('')

  const studentLessons = lessons
    .filter((l) => l.student_id === studentId)
    .sort((a, b) => a.lesson_number - b.lesson_number)

  return (
    <main
      style={{
        marginLeft: '80px',
        padding: '40px',
        fontFamily: 'DM Sans, sans-serif',
        background: '#f8fafb',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ color: '#1a7a7a', fontSize: '28px', marginBottom: '24px' }}>
        Lesson Editor
      </h1>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value)
            setLessonId('')
          }}
          style={{
            padding: '10px 14px',
            fontSize: '15px',
            border: '1px solid #1a7a7a',
            borderRadius: '6px',
            background: '#ffffff',
            minWidth: '220px',
          }}
        >
          <option value="">Select a student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          disabled={!studentId}
          style={{
            padding: '10px 14px',
            fontSize: '15px',
            border: '1px solid #c9a84c',
            borderRadius: '6px',
            background: '#ffffff',
            minWidth: '220px',
          }}
        >
          <option value="">Select a lesson…</option>
          {studentLessons.map((l) => (
            <option key={l.id} value={l.id}>
              Lesson {l.lesson_number} — {l.title}
            </option>
          ))}
        </select>
      </div>

      {lessonId && (
        <p style={{ color: '#1a7a7a' }}>
          ✅ Lesson selected. Editor textarea comes next.
        </p>
      )}
    </main>
  )
}
