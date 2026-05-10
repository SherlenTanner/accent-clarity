'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Student, Lesson } from '@/lib/supabase'
import { parseMarkup, splitSentences, createClient } from '@/lib/supabase'

interface Props {
  student: Student
  lesson: Lesson | null
}

type ColorTag = 'teal' | 'gold' | 'red' | 'purple'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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

export default function LessonClient({ student, lesson }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [timer, setTimer] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(lesson?.video_url ?? null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [feedbackText, setFeedbackText] = useState(lesson?.feedback ?? '')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const isAdmin = student.role === 'admin'
  const sentences = lesson?.sentences ? splitSentences(lesson.sentences) : []

  useEffect(() => {
    if (editorOpen && editorRef.current) {
      editorRef.current.innerHTML = markupToHtml(lesson?.sentences ?? '')
    }
  }, [editorOpen, lesson?.sentences])

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recording])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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

  const makeColoredSpan = (text: string, color: ColorTag): HTMLSpanElement => {
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

  const handleSave = async () => {
    console.log('[Save] Save button clicked')
    if (!lesson) {
      console.log('[Save] No lesson — aborting')
      alert('No lesson found to save to.')
      return
    }
    if (!editorRef.current) {
      console.log('[Save] Editor ref not ready — aborting')
      alert('Editor not ready. Please try again.')
      return
    }
    setSaving(true)
    const html = editorRef.current.innerHTML
    console.log('[Save] Editor HTML:', html)
    const markup = htmlToMarkup(html)
    console.log('[Save] Markup to save:', markup)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('lessons')
        .update({ sentences: markup })
        .eq('id', lesson.id)
      setSaving(false)
      if (error) {
        console.error('[Save] Supabase error:', error)
        alert('Save failed: ' + error.message)
      } else {
        console.log('[Save] Saved successfully!')
        setEditorOpen(false)
        window.location.reload()
      }
    } catch (err: any) {
      setSaving(false)
      console.error('[Save] Exception:', err)
      alert('Save threw an error: ' + (err?.message || String(err)))
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !lesson) return
    setUploadingVideo(true)
    const supabase = createClient()
    const filePath = `lesson-videos/${lesson.id}-${Date.now()}.mp4`
    const { error: uploadError } = await supabase.storage
      .from('lesson-videos')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploadingVideo(false)
      return
    }
    const { data } = supabase.storage.from('lesson-videos').getPublicUrl(filePath)
    const publicUrl = data.publicUrl
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ video_url: publicUrl })
      .eq('id', lesson.id)
    if (updateError) {
      alert('Save failed: ' + updateError.message)
    } else {
      setVideoUrl(publicUrl)
    }
    setUploadingVideo(false)
  }

  const handleSaveFeedback = async () => {
    if (!lesson) return
    setSavingFeedback(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('lessons')
      .update({ feedback: feedbackText })
      .eq('id', lesson.id)
    setSavingFeedback(false)
    if (error) {
      alert('Save failed: ' + error.message)
    } else {
      setFeedbackSaved(true)
      setTimeout(() => setFeedbackSaved(false), 3000)
    }
  }

  // ─── REAL MICROPHONE RECORDING ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)
        stream.getTracks().forEach(t => t.stop())
        uploadRecording(blob)
      }

      recorder.start()
      setRecording(true)
      setRecorded(false)
      setTimer(0)
      setSaveStatus('idle')
      setRecordedUrl(null)
    } catch (err: any) {
      console.error('Mic error:', err)
      alert('Could not access microphone.\n\n' + (err?.message || String(err)) + '\n\nMake sure you allowed microphone permissions in your browser. On Chrome: click the lock icon in the address bar → Site settings → Microphone → Allow.')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setRecording(false)
    setRecorded(true)
  }

  const uploadRecording = async (blob: Blob) => {
    if (!lesson) {
      console.error('[Recording] No lesson context')
      setSaveStatus('error')
      return
    }
    setSaveStatus('saving')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[Recording] No user')
        setSaveStatus('error')
        return
      }

      const timestamp = Date.now()
      const filename = `${user.id}/lesson-${lesson.id}-${timestamp}.webm`

      const { error: uploadErr } = await supabase.storage
        .from('recordings')
        .upload(filename, blob, { contentType: 'audio/webm' })

      if (uploadErr) {
        console.error('[Recording] Upload error:', uploadErr)
        setSaveStatus('error')
        return
      }

      const context = `Lesson ${lesson.lesson_number ?? '?'} — ${lesson.title || 'Untitled'}`
      const { error: dbErr } = await supabase.from('recordings').insert({
        student_id: user.id,
        page: 'lesson',
        context: context,
        storage_path: filename,
      })

      if (dbErr) {
        console.error('[Recording] DB error:', dbErr)
        setSaveStatus('error')
        return
      }

      console.log('[Recording] Saved successfully:', filename)
      setSaveStatus('saved')
    } catch (err) {
      console.error('[Recording] Save error:', err)
      setSaveStatus('error')
    }
  }

  const resetRecording = () => {
    setRecorded(false)
    setRecording(false)
    setTimer(0)
    setSaveStatus('idle')
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '80px', padding: '2rem 2.5rem', fontFamily: 'DM Sans, sans-serif' }}>

        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          LangSolution › Accent Clarity › Legal Track › My Personalized Lesson
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#1a7a7a', color: '#fff', fontSize: '0.72rem', fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '0.3rem 0.9rem', borderRadius: '20px', marginBottom: '0.6rem',
          }}>
            ⚖️ {student.name} — {student.profession}
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em', margin: '0 0 0.3rem 0' }}>
            {lesson?.title ?? 'Your Personalized Lesson'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>
            Based on your last live session with Sherlen{lesson?.lesson_date ? ` — ${lesson.lesson_date}` : ''}
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>

          <div style={{
            position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
            width: '260px',
            background: '#0e1a2e', borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            border: '2px solid rgba(26,122,122,0.3)',
          }}>
            <div style={{
              padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5bb8b8' }}>
                🎬 Shadow the Avatar
              </div>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    style={{
                      background: 'rgba(26,122,122,0.7)', color: '#fff', border: 'none',
                      padding: '0.25rem 0.6rem', borderRadius: '6px',
                      fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {uploadingVideo ? '⏳ Uploading…' : '⬆️ Upload Video'}
                  </button>
                  <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
                </>
              )}
            </div>

            {videoUrl ? (
              <video src={videoUrl} controls style={{ width: '100%', display: 'block', background: '#000' }} />
            ) : (
              <div style={{
                aspectRatio: '4/3', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0e1a2e, #1a3a4a)',
              }}>
                <div style={{
                  position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(26,122,122,0.85)', color: '#fff',
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '0.2rem 0.7rem', borderRadius: '20px', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                  <div style={{ width: '5px', height: '5px', background: '#4ade80', borderRadius: '50%', animation: 'blink 1s ease-in-out infinite' }} />
                  Now Speaking
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <div style={{
                    width: '55px', height: '55px',
                    background: 'linear-gradient(135deg, #d4a574, #c49060)',
                    borderRadius: '50%', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', background: '#2d1a0e', borderRadius: '50%' }} />
                      <div style={{ width: '6px', height: '6px', background: '#2d1a0e', borderRadius: '50%' }} />
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                      width: '20px', height: '8px', background: '#8a3a2a',
                      borderRadius: '0 0 10px 10px',
                      animation: 'mouthTalk 0.4s ease-in-out infinite alternate',
                    }} />
                  </div>
                  <div style={{
                    width: '80px', height: '90px',
                    background: 'linear-gradient(180deg, #2a4a7a, #1a3a6a)',
                    borderRadius: '40px 40px 14px 14px', marginTop: '-8px',
                  }} />
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  gap: '2px', paddingBottom: '8px', opacity: 0.4,
                }}>
                  {[6,11,16,22,16,11,18,13].map((h, i) => (
                    <div key={i} style={{
                      width: '3px', height: `${h}px`, background: '#2a9a9a', borderRadius: '2px',
                      animation: `avWave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    }} />
                  ))}
                </div>
                {isAdmin && (
                  <div style={{
                    position: 'absolute', bottom: '8px', left: '8px', right: '8px',
                    background: 'rgba(14,26,46,0.85)', borderRadius: '6px',
                    padding: '0.4rem 0.5rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center',
                  }}>
                    Upload your Synthesia or HeyGen video above
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(26,122,122,0.1)' }}>
              <div style={{ fontSize: '0.62rem', color: '#5bb8b8', fontWeight: 700, marginBottom: '0.2rem' }}>🪞 How to Shadow</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Listen first. Repeat immediately after — matching rhythm and sounds. Do this 2–3 times before recording.
              </div>
            </div>
          </div>

          <div style={{
            padding: '1.1rem 1.5rem', borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingRight: '300px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a7a' }}>
              ✍️ Your Personalized Sentences
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditorOpen(!editorOpen)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 0.9rem',
                  background: editorOpen ? '#c9a84c' : '#e8f5f5',
                  color: editorOpen ? '#fff' : '#1a7a7a',
                  border: '1px solid rgba(26,122,122,0.2)',
                  borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {editorOpen ? '✕ Close Editor' : '✏️ Edit'}
              </button>
            )}
          </div>

          <div style={{ padding: '1.4rem 1.5rem', paddingRight: '290px' }}>

            {editorOpen && isAdmin ? (
              <div>
                <div style={{
                  background: '#f8fafb', border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '0.7rem 1rem', marginBottom: '0.8rem', fontSize: '0.82rem',
                  color: '#6b7280', lineHeight: 1.5,
                }}>
                  <strong style={{ color: '#1a1a2e' }}>How to highlight:</strong> Type your sentences below. Select a word with your mouse, then click a color button. Click the same color again to remove it.
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('teal')} style={{
                    background: '#1a7a7a', color: '#fff', border: 'none',
                    padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    🟢 Go (practice this)
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('gold')} style={{
                    background: '#c9a84c', color: '#fff', border: 'none',
                    padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    🟡 Caution (watch this)
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('red')} style={{
                    background: '#ef4444', color: '#fff', border: 'none',
                    padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    🔴 Stop (common error)
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('purple')} style={{
                    background: '#7F77DD', color: '#fff', border: 'none',
                    padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    💜 Open Up (open mouth)
                  </button>
                </div>

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

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button type="button" onClick={handleSave} disabled={saving} style={{
                    background: '#1a7a7a', color: '#fff', border: 'none',
                    padding: '0.6rem 1.25rem', borderRadius: '6px',
                    cursor: saving ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  }}>{saving ? 'Saving…' : '💾 Save'}</button>
                  <button type="button" onClick={() => setEditorOpen(false)} style={{
                    background: '#eee', color: '#333', border: 'none',
                    padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                {lesson?.teacher_note && (
                  <div style={{
                    background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1.2rem',
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '0.3rem' }}>
                      📝 Note from Sherlen
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#2d2d2d', lineHeight: 1.6 }}>{lesson.teacher_note}</div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{
                    width: '20px', height: '20px', background: '#1a7a7a', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>1</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
                    Shadow the avatar — then read these sentences aloud
                  </div>
                </div>

                {sentences.length > 0 ? (
                  <div style={{
                    border: '1px solid #e5e7eb', borderLeft: '4px solid #1a7a7a',
                    borderRadius: '0 12px 12px 0', background: '#f8fafb', padding: '1.2rem 1.4rem', marginBottom: '1rem',
                  }}>
                    {sentences.map((line, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.8rem',
                        padding: '0.7rem 0',
                        borderBottom: i < sentences.length - 1 ? '1px solid #e5e7eb' : 'none',
                      }}>
                        <div style={{
                          width: '24px', height: '24px', background: '#1a7a7a', color: '#fff',
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.68rem', fontWeight: 700, flexShrink: 0, marginTop: '2px',
                        }}>{i + 1}</div>
                        <div
                          style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', lineHeight: 1.8, color: '#1a1a2e', flex: 1 }}
                          dangerouslySetInnerHTML={{ __html: parseMarkup(line) }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#888', marginBottom: '1rem' }}>No sentences yet.</div>
                )}

                <div style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
                  padding: '0.9rem 1.1rem', marginBottom: '1.2rem',
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.6rem' }}>
                    🚦 Color Guide
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#2d2d2d' }}>
                      <span style={{
                        background: '#e8f5f5', border: '1px solid #1a7a7a', borderRadius: '4px',
                        padding: '1px 6px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                      }}>green</span>
                      <strong style={{ color: '#1a7a7a' }}>GO</strong> — practice this sound
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#2d2d2d' }}>
                      <span style={{
                        background: 'rgba(201,168,76,0.2)', border: '2px solid #c9a84c', borderRadius: '4px',
                        padding: '1px 6px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                      }}>gold</span>
                      <strong style={{ color: '#c9a84c' }}>CAUTION</strong> — be careful here
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#2d2d2d' }}>
                      <span style={{
                        background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444', borderRadius: '4px',
                        padding: '1px 6px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                      }}>red</span>
                      <strong style={{ color: '#ef4444' }}>STOP</strong> — common error
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#2d2d2d' }}>
                      <span style={{
                        background: 'rgba(127,119,221,0.15)', border: '2px solid #7F77DD', borderRadius: '4px',
                        padding: '1px 6px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                      }}>open</span>
                      <strong style={{ color: '#7F77DD' }}>OPEN UP</strong> — open mouth, lengthen vowel
                    </div>
                  </div>
                </div>

                {lesson?.focus_sounds && lesson.focus_sounds.length > 0 && (
                  <div style={{ padding: '1rem 0', borderTop: '1px solid #e5e7eb', marginBottom: '1.2rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.7rem' }}>
                      🎯 Your Focus Sounds
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {lesson.focus_sounds.map((s, i) => (
                        <div key={i} style={{
                          display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.8rem',
                          border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.78rem',
                          fontWeight: 500, color: '#2d2d2d', background: '#f8fafb',
                        }}>{s}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '2px dashed #e5e7eb', margin: '1.2rem 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{
                    width: '20px', height: '20px', background: '#1a7a7a', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>2</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
                    Record yourself — sentences stay on screen while you read
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #e8f5f5, rgba(201,168,76,0.04))',
                  border: '1px solid rgba(26,122,122,0.15)', borderRadius: '10px',
                  padding: '0.9rem 1rem', marginBottom: '1rem', fontSize: '0.82rem',
                  color: '#2d2d2d', lineHeight: 1.6,
                }}>
                  💡 Read <strong style={{ color: '#1a7a7a' }}>all sentences</strong> clearly. They stay visible the whole time. Take your time.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '44px', margin: '0.8rem 0' }}>
                  {[10,18,28,36,28,20,32,22,14,26,34,18].map((h, i) => (
                    <div key={i} style={{
                      width: '4px', height: `${h}px`,
                      background: recording ? '#ef4444' : '#1a7a7a',
                      borderRadius: '2px',
                      animation: recording ? `waveAnim 0.6s ease-in-out ${i * 0.08}s infinite alternate` : 'none',
                      opacity: recording ? 1 : 0.3,
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>

                {recording && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>
                    🔴 Recording — {formatTime(timer)}
                  </div>
                )}

                {!recording && !recorded && (
                  <button type="button" onClick={startRecording} style={{
                    width: '100%', padding: '0.95rem', background: '#1a7a7a', color: '#fff',
                    border: 'none', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  }}>
                    🎤 Start Recording
                  </button>
                )}

                {recording && (
                  <button type="button" onClick={stopRecording} style={{
                    width: '100%', padding: '0.95rem', background: '#ef4444', color: '#fff',
                    border: 'none', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  }}>
                    ⏹ Stop &amp; Save Recording
                  </button>
                )}

                {recorded && (
                  <div style={{ marginTop: '1.2rem', background: '#f8fafb', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{
                      padding: '0.9rem 1.1rem',
                      background: 'linear-gradient(135deg, #e8f5f5, rgba(201,168,76,0.06))',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a7a' }}>
                        🎙️ Your Recording
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
                        {saveStatus === 'saving' && '⏳ Saving…'}
                        {saveStatus === 'saved' && '✅ Saved'}
                        {saveStatus === 'error' && '⚠️ Save failed'}
                        {saveStatus === 'idle' && 'Ready'}
                      </div>
                    </div>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                      {recordedUrl && (
                        <audio controls src={recordedUrl} style={{ width: '100%', marginBottom: '1rem' }} />
                      )}
                      {saveStatus === 'saving' && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                          Uploading your recording to your lesson…
                        </div>
                      )}
                      {saveStatus === 'saved' && (
                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginBottom: '1rem' }}>
                          Recording saved! Sherlen will review this before your next session.
                        </div>
                      )}
                      {saveStatus === 'error' && (
                        <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginBottom: '1rem' }}>
                          Something went wrong saving the recording. Try again.
                        </div>
                      )}
                      <button type="button" onClick={resetRecording} style={{
                        padding: '0.75rem 1.5rem', background: '#fff', color: '#1a7a7a',
                        border: '1px solid #1a7a7a', borderRadius: '10px',
                        fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        🔄 Record Again
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '2px dashed #e5e7eb', margin: '1.5rem 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '20px', height: '20px', background: '#c9a84c', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>3</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
                    Feedback from Sherlen
                  </div>
                </div>

                {isAdmin ? (
                  <div>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Type your feedback after reviewing the student's recording…"
                      style={{
                        width: '100%', minHeight: '120px', padding: '0.75rem',
                        border: '2px solid #c9a84c', borderRadius: '8px', fontSize: '0.9rem',
                        fontFamily: 'DM Sans, sans-serif', resize: 'vertical', lineHeight: 1.6,
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <button type="button" onClick={handleSaveFeedback} disabled={savingFeedback} style={{
                        background: '#c9a84c', color: '#fff', border: 'none',
                        padding: '0.6rem 1.25rem', borderRadius: '6px',
                        cursor: savingFeedback ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 600,
                      }}>
                        {savingFeedback ? 'Saving…' : '💾 Save Feedback'}
                      </button>
                      {feedbackSaved && (
                        <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                          ✅ Feedback saved!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  lesson?.feedback ? (
                    <div style={{
                      background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)',
                      borderLeft: '4px solid #c9a84c',
                      borderRadius: '0 10px 10px 0', padding: '1rem 1.2rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a84c' }}>
                          📣 Sherlen's Feedback
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#2d2d2d', lineHeight: 1.7 }}>
                        {lesson.feedback}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f8fafb', border: '1px solid #e5e7eb', borderRadius: '10px',
                      padding: '1rem 1.2rem', fontSize: '0.82rem', color: '#888', fontStyle: 'italic',
                    }}>
                      Sherlen will leave feedback here after reviewing your recording.
                    </div>
                  )
                )}

              </div>
            )}
          </div>
        </div>

        <div style={{
          textAlign: 'right', fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.2em', color: '#e5e7eb', textTransform: 'uppercase', marginTop: '2rem',
        }}>
          LANGSOLUTION ACCENT CLARITY
        </div>

        <style>{`
          @keyframes waveAnim { from { transform: scaleY(0.3); opacity: 0.4; } to { transform: scaleY(1); opacity: 1; } }
          @keyframes mouthTalk { from { height: 4px; } to { height: 14px; } }
          @keyframes avWave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        `}</style>

      </main>
    </div>
  )
}
