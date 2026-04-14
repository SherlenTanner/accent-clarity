'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Student, Lesson } from '@/lib/supabase'
import { parseMarkup, splitSentences, createClient } from '@/lib/supabase'

interface Props {
  student: Student
  lesson: Lesson | null
}

export default function LessonClient({ student, lesson }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorText, setEditorText] = useState(lesson?.sentences ?? '')
  const [saving, setSaving] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [timer, setTimer] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(lesson?.video_url ?? null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [feedbackText, setFeedbackText] = useState(lesson?.feedback ?? '')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isAdmin = student.role === 'admin'
  const sentences = lesson?.sentences ? splitSentences(lesson.sentences) : []

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recording])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const wrapSelection = (tag: 'teal' | 'gold' | 'red') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = editorText.substring(start, end)
    if (!selected) return
    const newText =
      editorText.substring(0, start) +
      `[${tag}]${selected}[/${tag}]` +
      editorText.substring(end)
    setEditorText(newText)
  }

  const handleSave = async () => {
    if (!lesson) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('lessons')
      .update({ sentences: editorText })
      .eq('id', lesson.id)
    setSaving(false)
    if (error) {
      alert('Save failed: ' + error.message)
    } else {
      setEditorOpen(false)
      window.location.reload()
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

  const startRecording = () => { setRecording(true); setRecorded(false); setTimer(0) }
  const stopRecording = () => { setRecording(false); setRecorded(true) }
  const resetRecording = () => { setRecorded(false); setRecording(false); setTimer(0) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '80px', padding: '2rem 2.5rem', fontFamily: 'DM Sans, sans-serif' }}>

        {/* Breadcrumb */}
        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          LangSolution › Accent Clarity › Legal Track › My Personalized Lesson
        </div>

        {/* Header */}
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

        {/* Main panel */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>

          {/* ── FLOATING VIDEO — top right corner ── */}
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

          {/* Panel header */}
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
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {(['teal', 'gold', 'red'] as const).map(tag => (
                    <button key={tag} onClick={() => wrapSelection(tag)} style={{
                      background: tag === 'teal' ? '#1a7a7a' : tag === 'gold' ? '#c9a84c' : '#c44',
                      color: '#fff', border: 'none', padding: '0.4rem 0.8rem',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                    }}>
                      {tag === 'teal' ? 'Teal (focus)' : tag === 'gold' ? 'Gold (watch)' : 'Red (error)'}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Type sentences here. Select a word and click a color button to highlight it."
                  style={{
                    width: '100%', minHeight: '200px', padding: '0.75rem',
                    border: '2px solid #1a7a7a', borderRadius: '8px', fontSize: '1rem',
                    fontFamily: 'DM Sans, sans-serif', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button onClick={handleSave} disabled={saving} style={{
                    background: '#1a7a7a', color: '#fff', border: 'none',
                    padding: '0.6rem 1.25rem', borderRadius: '6px',
                    cursor: saving ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  }}>{saving ? 'Saving…' : '💾 Save'}</button>
                  <button onClick={() => { setEditorText(lesson?.sentences ?? ''); setEditorOpen(false) }} style={{
                    background: '#eee', color: '#333', border: 'none',
                    padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                {/* Teacher note */}
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

                {/* Step 1 */}
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

                {/* Color legend */}
                <div style={{
                  display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem',
                  padding: '0.7rem 1rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                }}>
                  {[
                    { color: '#e8f5f5', border: '1px solid #1a7a7a', label: 'Focus sound' },
                    { color: 'rgba(201,168,76,0.2)', border: '2px solid #c9a84c', label: 'Watch this word' },
                    { color: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444', label: 'Common error here' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#6b7280' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, border: item.border }} />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Sentences */}
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

                {/* Focus sounds */}
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

                {/* Divider */}
                <div style={{ borderTop: '2px dashed #e5e7eb', margin: '1.2rem 0' }} />

                {/* Step 2 — Record */}
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

                {/* Waveform */}
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
                  <button onClick={startRecording} style={{
                    width: '100%', padding: '0.95rem', background: '#1a7a7a', color: '#fff',
                    border: 'none', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  }}>
                    🎤 Start Recording
                  </button>
                )}

                {recording && (
                  <button onClick={stopRecording} style={{
                    width: '100%', padding: '0.95rem', background: '#ef4444', color: '#fff',
                    border: 'none', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  }}>
                    ⏹ Stop &amp; Get AI Feedback
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
                        🤖 AI Feedback
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>Coming soon</div>
                    </div>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎙️</div>
                      <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '0.4rem', fontSize: '1rem' }}>Recording saved!</div>
                      <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto 1.2rem' }}>
                        Sherlen will review this before your next session. AI scoring powered by Gemini is coming soon.
                      </div>
                      <button onClick={resetRecording} style={{
                        padding: '0.75rem 1.5rem', background: '#fff', color: '#1a7a7a',
                        border: '1px solid #1a7a7a', borderRadius: '10px',
                        fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        🔄 Record Again
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DIVIDER ── */}
                <div style={{ borderTop: '2px dashed #e5e7eb', margin: '1.5rem 0' }} />

                {/* ── FEEDBACK FROM SHERLEN ── */}
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

                {/* Admin sees edit box */}
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
                      <button onClick={handleSaveFeedback} disabled={savingFeedback} style={{
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
                  /* Student sees the feedback card */
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