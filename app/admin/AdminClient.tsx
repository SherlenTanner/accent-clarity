'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import type { Student, Lesson, Score } from '@/lib/supabase'

interface Props {
  students:      Student[]
  allLessons:    Lesson[]
  allScores:     Score[]
  studentScores: Record<string, number>
  stats: {
    activeStudents:   number
    totalLessonsBuilt: number
    avgScore:         number
    onPause:          number
  }
  adminName: string
}

const ALL_SOUNDS = ['/θ/', '/ð/', '/r/', '/v/', '/w/', '/h/', '/æ/', '/ə/', 'Linking', 'Stress', 'Weak Forms']

type EditorTab = 'lesson' | 'sounds' | 'features' | 'progress'

type ColorTag = 'teal' | 'gold' | 'red' | 'purple'

function markupToHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/\[teal\](.*?)\[\/teal\]/g, '<span data-color="teal" style="background:#e8f5f5;border:1px solid #1a7a7a;border-radius:4px;padding:1px 4px;">$1</span>')
    .replace(/\[gold\](.*?)\[\/gold\]/g, '<span data-color="gold" style="background:rgba(201,168,76,0.2);border:2px solid #c9a84c;border-radius:4px;padding:1px 4px;">$1</span>')
    .replace(/\[red\](.*?)\[\/red\]/g, '<span data-color="red" style="background:rgba(239,68,68,0.1);border:2px solid #ef4444;border-radius:4px;padding:1px 4px;">$1</span>')
    .replace(/\[purple\](.*?)\[\/purple\]/g, '<span data-color="purple" style="background:rgba(127,119,221,0.15);border:2px solid #7F77DD;border-radius:4px;padding:1px 4px;">$1</span>')
    .replace(/\n/g, '<br>')
}

function htmlToMarkup(html: string): string {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const spans = tmp.querySelectorAll('span[data-color]')
  spans.forEach(span => {
    const color = span.getAttribute('data-color')
    const text = span.textContent || ''
    span.replaceWith(`[${color}]${text}[/${color}]`)
  })
  let result = tmp.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
  const cleanup = document.createElement('div')
  cleanup.innerHTML = result
  return cleanup.textContent || cleanup.innerText || ''
}

function makeColoredSpan(text: string, color: ColorTag): HTMLSpanElement {
  const span = document.createElement('span')
  span.setAttribute('data-color', color)
  if (color === 'teal') {
    span.style.cssText = 'background:#e8f5f5;border:1px solid #1a7a7a;border-radius:4px;padding:1px 4px;'
  } else if (color === 'gold') {
    span.style.cssText = 'background:rgba(201,168,76,0.2);border:2px solid #c9a84c;border-radius:4px;padding:1px 4px;'
  } else if (color === 'red') {
    span.style.cssText = 'background:rgba(239,68,68,0.1);border:2px solid #ef4444;border-radius:4px;padding:1px 4px;'
  } else if (color === 'purple') {
    span.style.cssText = 'background:rgba(127,119,221,0.15);border:2px solid #7F77DD;border-radius:4px;padding:1px 4px;'
  }
  span.textContent = text
  return span
}

export default function AdminClient({ students, allLessons, allScores, studentScores, stats, adminName }: Props) {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(
    students.length > 0 ? students[0].id : null
  )
  const [editorTab, setEditorTab] = useState<EditorTab>('lesson')
  const [saving, setSaving]       = useState(false)
  const [savedMsg, setSavedMsg]   = useState('')

  // Add New Student modal state
  const [showAddModal, setShowAddModal]   = useState(false)
  const [newName, setNewName]             = useState('')
  const [newEmail, setNewEmail]           = useState('')
  const [newProfession, setNewProfession] = useState('')
  const [newLocation, setNewLocation]     = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [addError, setAddError]           = useState('')
  const [addSuccess, setAddSuccess]       = useState('')

  const router = useRouter()
  const supabase = createClient()

  const editorRef = useRef<HTMLDivElement>(null)

  const activeStudent = students.find(s => s.id === activeStudentId) ?? null

  const studentLessons   = allLessons.filter(l => l.student_id === activeStudentId)
  const studentScoreList = allScores.filter(s => s.student_id === activeStudentId)

  const currentLesson = studentLessons.find(l => l.status === 'active')
  const [selectedLessonNum, setSelectedLessonNum] = useState<number>(currentLesson?.lesson_number ?? 7)

  const selectedLesson = studentLessons.find(l => l.lesson_number === selectedLessonNum)

  const [lessonTitle, setLessonTitle]   = useState(selectedLesson?.title ?? '')
  const [lessonDate, setLessonDate]     = useState(selectedLesson?.lesson_date ?? '')
  const [sentences, setSentences]       = useState(selectedLesson?.sentences ?? '')
  const [teacherNote, setTeacherNote]   = useState(selectedLesson?.teacher_note ?? '')
  const [totalLessons, setTotalLessons] = useState(activeStudent?.total_lessons ?? 20)
  const [focusSounds, setFocusSounds]   = useState<string[]>(selectedLesson?.focus_sounds ?? ['/θ/', '/ð/', '/r/'])
  const [features, setFeatures]         = useState<any>(activeStudent?.features ?? {
    personalized_lessons: true,
    record_feedback: true,
    sound_library: true,
    fluency_skills: false,
    avatar_shadowing: true,
    progress_tracker: true,
  })

  const handleSelectStudent = (student: Student) => {
    setActiveStudentId(student.id)
    setEditorTab('lesson')
    setSavedMsg('')
    const lessons = allLessons.filter(l => l.student_id === student.id)
    const active  = lessons.find(l => l.status === 'active')
    const num     = active?.lesson_number ?? student.current_lesson
    setSelectedLessonNum(num)
    const lesson = lessons.find(l => l.lesson_number === num)
    setLessonTitle(lesson?.title ?? '')
    setLessonDate(lesson?.lesson_date ?? '')
    setSentences(lesson?.sentences ?? '')
    setTeacherNote(lesson?.teacher_note ?? '')
    setFocusSounds(lesson?.focus_sounds ?? [])
    setTotalLessons(student.total_lessons)
    if (student.features) setFeatures(student.features)
  }

  const handleSelectLesson = (num: number) => {
    setSelectedLessonNum(num)
    const lesson = studentLessons.find(l => l.lesson_number === num)
    setLessonTitle(lesson?.title ?? '')
    setLessonDate(lesson?.lesson_date ?? '')
    setSentences(lesson?.sentences ?? '')
    setTeacherNote(lesson?.teacher_note ?? '')
    setFocusSounds(lesson?.focus_sounds ?? [])
    setSavedMsg('')
  }

  const toggleSound = (sound: string) => {
    setFocusSounds(prev =>
      prev.includes(sound) ? prev.filter(s => s !== sound) : [...prev, sound]
    )
  }

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const showSaved = (msg: string) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleAddStudent = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      setAddError('Name and email are required.')
      return
    }
    setAddingStudent(true)
    setAddError('')
    setAddSuccess('')
    try {
      const res = await fetch('/api/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          profession: newProfession.trim(),
          location: newLocation.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error ?? 'Something went wrong.')
      } else {
        setAddSuccess(`✅ ${newName} has been added! They'll receive an invite email to set their password.`)
        setNewName('')
        setNewEmail('')
        setNewProfession('')
        setNewLocation('')
        router.refresh()
      }
    } catch {
      setAddError('Network error — please try again.')
    }
    setAddingStudent(false)
  }

  const handleSaveLesson = async () => {
    if (!activeStudent || !selectedLesson) return
    setSaving(true)
    // Read sentences from the visual editor (convert back to bracket markup)
    const sentencesToSave = editorRef.current ? htmlToMarkup(editorRef.current.innerHTML) : sentences
    await supabase
      .from('lessons')
      .update({ title: lessonTitle, lesson_date: lessonDate, sentences: sentencesToSave, teacher_note: teacherNote, focus_sounds: focusSounds })
      .eq('id', selectedLesson.id)
    setSentences(sentencesToSave)
    setSaving(false)
    showSaved('Lesson saved ✓')
    router.refresh()
  }

  // Load the visual editor with the saved markup whenever the lesson changes or tab opens
  useEffect(() => {
    if (editorTab === 'lesson' && editorRef.current) {
      editorRef.current.innerHTML = markupToHtml(sentences)
    }
  }, [sentences, editorTab, selectedLessonNum, activeStudentId])

  // Apply or toggle a color on the selected text in the editor
  const applyColor = (color: ColorTag) => {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    let parent: Node | null = range.commonAncestorContainer
    while (parent && parent !== editor) {
      if (parent.nodeType === 1) {
        const el = parent as HTMLElement
        if (el.tagName === 'SPAN' && el.hasAttribute('data-color')) {
          const existingColor = el.getAttribute('data-color')
          if (existingColor === color) {
            const textNode = document.createTextNode(el.textContent || '')
            el.replaceWith(textNode)
            selection.removeAllRanges()
            return
          }
          const newSpan = makeColoredSpan(el.textContent || '', color)
          el.replaceWith(newSpan)
          selection.removeAllRanges()
          return
        }
      }
      parent = parent.parentNode
    }

    const selectedText = range.toString()
    if (!selectedText) return
    const span = makeColoredSpan(selectedText, color)
    range.deleteContents()
    range.insertNode(span)
    selection.removeAllRanges()
  }

  const handleSaveSounds = async () => {
    if (!selectedLesson) return
    setSaving(true)
    await supabase.from('lessons').update({ focus_sounds: focusSounds }).eq('id', selectedLesson.id)
    setSaving(false)
    showSaved('Focus sounds saved ✓')
    router.refresh()
  }

  const handleSaveFeatures = async () => {
    if (!activeStudent) return
    setSaving(true)
    await supabase.from('students').update({ features, total_lessons: totalLessons }).eq('id', activeStudent.id)
    setSaving(false)
    showSaved('Settings saved ✓')
    router.refresh()
  }

  const handleTogglePause = async () => {
    if (!activeStudent) return
    const newStatus = activeStudent.status === 'active' ? 'paused' : 'active'
    await supabase.from('students').update({ status: newStatus }).eq('id', activeStudent.id)
    showSaved(`Student ${newStatus === 'paused' ? 'paused' : 'reactivated'} ✓`)
    router.refresh()
  }

  const lessonDotState = (num: number): string => {
    const l = studentLessons.find(x => x.lesson_number === num)
    if (!l) return 'empty'
    if (l.status === 'done') return 'done'
    if (l.status === 'active') return 'active'
    return 'empty'
  }

  const FEATURES = [
    { key: 'personalized_lessons' as const, icon: '📚', name: 'Personalized Lessons', desc: 'Custom sentence sets per session' },
    { key: 'record_feedback'      as const, icon: '🎙️', name: 'Record & Feedback',    desc: 'AI-powered pronunciation scoring' },
    { key: 'sound_library'        as const, icon: '🔤', name: 'Sound Library',         desc: 'Full phoneme reference library' },
    { key: 'fluency_skills'       as const, icon: '🔗', name: 'Fluency Skills',        desc: 'Linking, rhythm and connected speech' },
    { key: 'avatar_shadowing'     as const, icon: '🎬', name: 'Avatar Shadowing',      desc: 'Animated avatar to shadow' },
    { key: 'progress_tracker'     as const, icon: '📊', name: 'Progress Tracker',      desc: 'Score history and lesson progress' },
  ]

  return (
    <div className="layout">
      <Sidebar isAdmin />
      <main className="main">

        {/* Add New Student Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal)', marginBottom: '0.25rem' }}>
                Add New Student
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                They'll receive an email invite to set their password.
              </div>

              {addSuccess ? (
                <div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '1rem', borderRadius: 10, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {addSuccess}
                  </div>
                  <button className="btn-save" onClick={() => { setShowAddModal(false); setAddSuccess('') }}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-section">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Maria Rodriguez" />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. maria@hospital.com" />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Profession</label>
                    <input className="form-input" value={newProfession} onChange={e => setNewProfession(e.target.value)} placeholder="e.g. Pharmacist" />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Miami, FL" />
                  </div>

                  {addError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                      {addError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button className="btn-save" onClick={handleAddStudent} disabled={addingStudent} style={{ flex: 1 }}>
                      {addingStudent ? 'Adding…' : '+ Add Student'}
                    </button>
                    <button className="btn-pause" onClick={() => { setShowAddModal(false); setAddError('') }} style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="brand-bar">
          <span className="brand-title">LangSolution Accent Clarity</span>
          <span className="admin-badge">Admin Panel</span>
        </div>

        <div className="breadcrumb">
          <span>LangSolution</span>
          <span className="breadcrumb-sep">›</span>
          <span>Accent Clarity</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">Admin</span>
        </div>

        <div className="admin-page-header">
          <div>
            <div className="admin-page-title">Student Management</div>
            <div className="admin-page-sub">Manage lessons, sentences, scores and settings for each student</div>
          </div>
          <button className="btn-add" onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess('') }}>
            + Add New Student
          </button>
        </div>

        <div className="admin-stats-row">
          <div className="stat-card">
            <div className="stat-card-num">{stats.activeStudents}</div>
            <div className="stat-card-label">Active Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-num">{stats.totalLessonsBuilt}</div>
            <div className="stat-card-label">Total Lessons Built</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-num success">{stats.avgScore}%</div>
            <div className="stat-card-label">Avg Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-num gold">{stats.onPause}</div>
            <div className="stat-card-label">On Pause</div>
          </div>
        </div>

        <div className="student-grid">
          {students.map(student => {
            const progress = Math.round(((student.current_lesson - 1) / student.total_lessons) * 100)
            const avg      = studentScores[student.id] ?? 0
            return (
              <div
                key={student.id}
                className={`student-card ${activeStudentId === student.id ? 'active' : ''}`}
                onClick={() => handleSelectStudent(student)}
              >
                <div className="student-card-top">
                  <div className="student-avatar" style={{ background: student.avatar_color }}>
                    {student.avatar_initials}
                  </div>
                  <div>
                    <div className="student-name">{student.name}</div>
                    <div className="student-role">⚖️ {student.profession} · {student.location}</div>
                    <div className={`student-status ${student.status}`}>
                      <div className={`status-dot ${student.status}`} />
                      {student.status === 'active' ? 'Active' : 'On Pause'}
                    </div>
                  </div>
                </div>
                <div className="student-card-bottom">
                  <div className="progress-mini">
                    <div className="progress-mini-label">Lesson {student.current_lesson} of {student.total_lessons}</div>
                    <div className="progress-mini-bar">
                      <div className="progress-mini-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="score-chip">{avg > 0 ? `${avg}%` : '—'}</span>
                  <button className="btn-edit" onClick={e => { e.stopPropagation(); handleSelectStudent(student) }}>
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {activeStudent && (
          <div className="editor-panel">
            <div className="editor-header">
              <div className="editor-header-title">✏️ Editing — {activeStudent.name}</div>
              <div className="editor-header-sub">
                {activeStudent.profession} · {activeStudent.location} · Lesson {activeStudent.current_lesson} of {activeStudent.total_lessons}
              </div>
              <div className="editor-header-actions">
                <button className="btn-pause" onClick={handleTogglePause}>
                  {activeStudent.status === 'active' ? '⏸ Pause Student' : '▶ Reactivate'}
                </button>
                <Link href="/dashboard" className="btn-view">View as Student →</Link>
              </div>
            </div>

            {savedMsg && (
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                {savedMsg}
              </div>
            )}

            <div className="editor-tabs">
              {(['lesson', 'sounds', 'features', 'progress'] as EditorTab[]).map(tab => (
                <button
                  key={tab}
                  className={`editor-tab ${editorTab === tab ? 'active' : ''}`}
                  onClick={() => setEditorTab(tab)}
                >
                  {tab === 'lesson'   ? '📝 Lesson Content' :
                   tab === 'sounds'   ? '🎯 Focus Sounds'   :
                   tab === 'features' ? '⚙️ Features'       :
                                        '📊 Progress'}
                </button>
              ))}
            </div>

            <div className="editor-body">
              {editorTab === 'lesson' && (
                <div>
                  <div className="lesson-selector">
                    {Array.from({ length: activeStudent.total_lessons }, (_, i) => i + 1).map(n => {
                      const state = n === selectedLessonNum ? 'selected' : lessonDotState(n)
                      return (
                        <button key={n} className={`ls-dot ${state}`} onClick={() => handleSelectLesson(n)} title={`Lesson ${n}`}>
                          {lessonDotState(n) === 'done' ? '✓' : n}
                        </button>
                      )
                    })}
                  </div>
                  <div className="form-row">
                    <div className="form-section">
                      <label className="form-label">Lesson Title</label>
                      <input className="form-input" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Courtroom Communication" />
                    </div>
                    <div className="form-section">
                      <label className="form-label">Date</label>
                      <input className="form-input" value={lessonDate} onChange={e => setLessonDate(e.target.value)} placeholder="e.g. April 9, 2026" />
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafb', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '0.7rem 1rem', marginBottom: '0.8rem', fontSize: '0.82rem',
                    color: '#6b7280', lineHeight: 1.5,
                  }}>
                    <strong style={{ color: '#1a1a2e' }}>🚦 How to highlight:</strong> Select a word with your mouse, then click a color button. Click the same color again to remove it.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('teal')} style={{
                      background: '#1a7a7a', color: '#fff', border: 'none',
                      padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}>🟢 Go (practice this)</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('gold')} style={{
                      background: '#c9a84c', color: '#fff', border: 'none',
                      padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}>🟡 Caution (watch this)</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('red')} style={{
                      background: '#ef4444', color: '#fff', border: 'none',
                      padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}>🔴 Stop (common error)</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('purple')} style={{
                      background: '#7F77DD', color: '#fff', border: 'none',
                      padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                    }}>💜 Open Up (open mouth)</button>
                  </div>
                  <div className="form-section">
                    <label className="form-label">Sentences (one per line)</label>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      style={{
                        width: '100%', minHeight: '200px', padding: '0.9rem 1rem',
                        border: '2px solid #1a7a7a', borderRadius: '8px',
                        fontSize: '1.05rem', fontFamily: 'Cormorant Garamond, serif',
                        lineHeight: 1.8, color: '#1a1a2e', background: '#fff',
                        outline: 'none', whiteSpace: 'pre-wrap',
                      }}
                    />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Teacher Note (private — shown to student before recording)</label>
                    <textarea className="form-textarea" value={teacherNote} onChange={e => setTeacherNote(e.target.value)} placeholder="Personal note to the student about this lesson..." rows={3} style={{ minHeight: 80 }} />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Total Lessons in Journey</label>
                    <div className="count-picker">
                      <button className="count-btn" onClick={() => setTotalLessons(l => Math.max(5, l - 5))}>−5</button>
                      <button className="count-btn" onClick={() => setTotalLessons(l => Math.max(5, l - 1))}>−1</button>
                      <span className="count-num">{totalLessons}</span>
                      <button className="count-btn" onClick={() => setTotalLessons(l => Math.min(50, l + 1))}>+1</button>
                      <button className="count-btn" onClick={() => setTotalLessons(l => Math.min(50, l + 5))}>+5</button>
                    </div>
                  </div>
                  <button className="btn-save" onClick={handleSaveLesson} disabled={saving}>
                    {saving ? 'Saving…' : `💾 Save Lesson ${selectedLessonNum}`}
                  </button>
                </div>
              )}

              {editorTab === 'sounds' && (
                <div>
                  <div className="form-section">
                    <label className="form-label">Select Focus Sounds for {activeStudent.name}</label>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                      These appear as chips on the lesson page and guide the AI feedback.
                    </p>
                    <div className="sounds-picker">
                      {ALL_SOUNDS.map(sound => (
                        <button key={sound} className={`sound-pick ${focusSounds.includes(sound) ? 'selected' : ''}`} onClick={() => toggleSound(sound)}>
                          {sound}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="btn-save" onClick={handleSaveSounds} disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Focus Sounds'}
                  </button>
                </div>
              )}

              {editorTab === 'features' && (
                <div>
                  <div className="form-section">
                    <label className="form-label">Features Visible to {activeStudent.name}</label>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                      Turn features on or off for this student's view.
                    </p>
                    <div className="features-grid">
                      {FEATURES.map(feat => (
                        <div className="feature-toggle" key={feat.key}>
                          <div className="feature-info">
                            <div className="feature-name">{feat.icon} {feat.name}</div>
                            <div className="feature-desc">{feat.desc}</div>
                          </div>
                          <div className={`toggle ${features[feat.key] ? 'on' : ''}`} onClick={() => toggleFeature(feat.key)} role="switch" aria-checked={features[feat.key]} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn-save" onClick={handleSaveFeatures} disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Features'}
                  </button>
                </div>
              )}

              {editorTab === 'progress' && (
                <div>
                  <div className="form-section">
                    <label className="form-label">{activeStudent.name}&rsquo;s Score History</label>
                    {studentScoreList.length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                        No scores recorded yet.
                      </div>
                    ) : (
                      <div className="score-history">
                        {studentScoreList.map(score => (
                          <div key={score.id} className={`score-history-item ${score.lesson_number === activeStudent.current_lesson ? 'current-lesson' : ''}`}>
                            <div className="score-hist-num">{score.lesson_number}</div>
                            <div className="score-hist-info">
                              <div className="score-hist-title">{score.lesson_title ?? `Lesson ${score.lesson_number}`}</div>
                              <div className="score-hist-date">{new Date(score.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div className="score-hist-score">{score.overall_score}%</div>
                          </div>
                        ))}
                        {!studentScoreList.find(s => s.lesson_number === activeStudent.current_lesson) && (
                          <div className="score-history-item current-lesson">
                            <div className="score-hist-num">{activeStudent.current_lesson}</div>
                            <div className="score-hist-info">
                              <div className="score-hist-title">{studentLessons.find(l => l.lesson_number === activeStudent.current_lesson)?.title ?? `Lesson ${activeStudent.current_lesson}`}</div>
                              <div className="score-hist-date">In progress</div>
                            </div>
                            <div className="score-hist-score in-progress">In Progress</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      <div className="watermark">LangSolution · Admin</div>
    </div>
  )
}