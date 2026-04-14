import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import type { Student, Lesson, Score } from '@/lib/supabase'
import { splitSentences } from '@/lib/supabase'
import type { CSSProperties } from 'react'

const T = {
  teal: '#1a7a7a', tealDk: '#145f5f', tealLt: '#e8f5f5', tealMid: '#2a9a9a',
  gold: '#c9a84c', ink: '#1a1a2e', text: '#2d2d2d', muted: '#6b7280',
  border: '#e5e7eb', bg: '#f8fafb', white: '#ffffff',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  font: '"DM Sans", system-ui, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
} as const
function hlMarkup(text: string): string {
  return text
    .replace(/\[teal\](.*?)\[\/teal\]/g, `<strong style="color:${T.teal};font-weight:600">$1</strong>`)
    .replace(/\[gold\](.*?)\[\/gold\]/g, `<strong style="color:${T.gold};font-weight:600">$1</strong>`)
    .replace(/\[red\](.*?)\[\/red\]/g, `<strong style="color:${T.danger};font-weight:600">$1</strong>`)
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const byId = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()
  const byEmail = !byId.data && user.email
    ? await supabase.from('students').select('*').eq('email', user.email).maybeSingle()
    : { data: null }
  let student = (byId.data ?? byEmail.data) as Student | null

  if (student && !student.user_id) {
    await supabase.from('students').update({ user_id: user.id }).eq('id', student.id)
    student = { ...student, user_id: user.id }
  }

  if (student?.role === 'admin') redirect('/admin')
  if (!student) return <div>Profile not found. Please contact Sherlen.</div>

  const { data: currentLesson } = await supabase
    .from('lessons').select('*').eq('student_id', student.id).eq('status', 'active')
    .single() as { data: Lesson | null }

  const { data: scores } = await supabase
    .from('scores').select('*').eq('student_id', student.id)
    .order('lesson_number', { ascending: false }).limit(6) as { data: Score[] | null }

  const avgScore = (scores ?? []).length > 0
    ? Math.round((scores ?? []).reduce((s, r) => s + (r.overall_score ?? 0), 0) / (scores ?? []).length)
    : 0
  const completedCount = student.current_lesson - 1
  const remaining = student.total_lessons - completedCount
  const progressPct = Math.round((completedCount / student.total_lessons) * 100)
  const latestScore = scores?.[0]
  const soundsScores = latestScore?.sounds_scores ?? {}
  const sentenceLines = currentLesson?.sentences ? splitSentences(currentLesson.sentences).slice(0, 4) : []
  const dots = Array.from({ length: student.total_lessons }, (_, i) => {
    const n = i + 1
    if (n < student.current_lesson) return { n, state: 'done' as const }
    if (n === student.current_lesson) return { n, state: 'current' as const }
    return { n, state: 'locked' as const }
  })
  const barColor = (pct: number) => pct >= 80 ? T.success : T.warning

  // ── Styles ──
  const layout: CSSProperties = { display: 'flex', minHeight: '100vh', fontFamily: T.font, background: T.bg, color: T.text }
  const main: CSSProperties = { marginLeft: 80, flex: 1, padding: '2.5rem' }
  const header: CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: T.ink, marginBottom: '1.8rem' }
  const card: CSSProperties = { background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, marginBottom: '1.5rem' }

  // Welcome card
  const wcGrid: CSSProperties = { ...card, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 320, overflow: 'hidden' }
  const wcLeft: CSSProperties = { padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }
  const wcTag: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: T.tealLt, color: T.teal, fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 0.9rem', borderRadius: 20, marginBottom: '1.2rem', width: 'fit-content' }
  const wcDot: CSSProperties = { width: 6, height: 6, background: T.teal, borderRadius: '50%' }
  const wcName: CSSProperties = { fontFamily: T.serif, fontSize: '3rem', fontWeight: 300, color: T.ink, lineHeight: 1.1, marginBottom: '0.3rem', letterSpacing: '-0.01em' }
  const wcProf: CSSProperties = { fontSize: '0.88rem', color: T.muted, marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }
  const wcPdot: CSSProperties = { width: 4, height: 4, background: T.muted, borderRadius: '50%' }
  const coachMsg: CSSProperties = { background: `linear-gradient(135deg, ${T.tealLt}, rgba(201,168,76,0.06))`, border: `1px solid rgba(26,122,122,0.15)`, borderLeft: `3px solid ${T.teal}`, borderRadius: '0 10px 10px 0', padding: '1rem 1.2rem', marginBottom: '1.8rem', fontFamily: T.serif, fontSize: '1rem', color: T.text, lineHeight: 1.7 }
  const coachLabel: CSSProperties = { fontFamily: T.font, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.teal, marginBottom: '0.4rem' }
  const actions: CSSProperties = { display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }
  const btnPrimary: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem', background: T.teal, color: 'white', border: 'none', borderRadius: 10, fontFamily: T.font, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }
  const btnGhost: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.4rem', background: 'transparent', color: T.teal, border: `1px solid rgba(26,122,122,0.3)`, borderRadius: 10, fontFamily: T.font, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }
  const wcRight: CSSProperties = { position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, #f0f9f9, ${T.tealLt})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const wcImg: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }
  const wcBadge: CSSProperties = { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0.5rem 1.2rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '0.5rem' }
  const badgeDot: CSSProperties = { width: 8, height: 8, background: T.success, borderRadius: '50%' }

  // Progress card
  const pcCard: CSSProperties = { ...card, padding: '1.8rem 2rem' }
  const pcHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }
  const pcTitle: CSSProperties = { fontSize: '1rem', fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }
  const pcSub: CSSProperties = { fontSize: '0.8rem', color: T.muted, marginTop: '0.15rem' }
  const pcViewAll: CSSProperties = { fontSize: '0.78rem', color: T.teal, fontWeight: 600, textDecoration: 'none' }
  const pcStats: CSSProperties = { display: 'flex', gap: '1rem', marginBottom: '1.8rem' }
  const pcStat: CSSProperties = { flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '1.1rem 1.2rem', textAlign: 'center' }
  const pcStatNum = (color?: string): CSSProperties => ({ fontFamily: T.serif, fontSize: '2.2rem', fontWeight: 600, color: color ?? T.teal, lineHeight: 1, marginBottom: '0.3rem' })
  const pcStatLabel: CSSProperties = { fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }
  const pcBarWrap: CSSProperties = { marginBottom: '1.5rem' }
  const pcBarMeta: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }
  const pcBarLabel: CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: T.ink }
  const pcBarPct: CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: T.teal }
  const pcBarTrack: CSSProperties = { height: 10, background: T.border, borderRadius: 10, overflow: 'hidden' }
  const pcBarFill: CSSProperties = { height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${T.teal}, ${T.tealMid})`, width: `${progressPct}%` }
  const pcDots: CSSProperties = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }
  const dotBase: CSSProperties = { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }
  const dotStyle = (state: string): CSSProperties => {
    if (state === 'done') return { ...dotBase, background: T.success, color: 'white' }
    if (state === 'current') return { ...dotBase, background: T.teal, color: 'white', border: `3px solid ${T.gold}`, boxShadow: '0 0 0 4px rgba(201,168,76,0.15)', width: 38, height: 38, fontSize: '0.7rem' }
    return { ...dotBase, background: T.border, color: T.muted }
  }

  // Bottom grid
  const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }

  // Lesson card
  const lcCard: CSSProperties = { ...card, padding: '1.8rem', position: 'relative', overflow: 'hidden', marginBottom: 0 }
  const lcBar: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${T.teal}, ${T.tealMid})` }
  const lcNum: CSSProperties = { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.teal, marginBottom: '0.4rem' }
  const lcTitle: CSSProperties = { fontFamily: T.serif, fontSize: '1.4rem', fontWeight: 600, color: T.ink, marginBottom: '0.4rem' }
  const lcDesc: CSSProperties = { fontSize: '0.82rem', color: T.muted, lineHeight: 1.6, marginBottom: '1.4rem' }
  const lcSentences: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.4rem' }
  const lcSp: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0.8rem', background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.tealLt}` }
  const lcSpNum: CSSProperties = { fontSize: '0.65rem', fontWeight: 700, color: T.teal, background: T.tealLt, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }
  const lcSpText: CSSProperties = { fontSize: '0.82rem', color: T.text, lineHeight: 1.5 }
  const lcBtn: CSSProperties = { width: '100%', padding: '0.85rem', background: T.teal, color: 'white', border: 'none', borderRadius: 10, fontFamily: T.font, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }

  // Score card
  const scCard: CSSProperties = { ...card, padding: '1.8rem', marginBottom: 0 }
  const scBig: CSSProperties = { fontFamily: T.serif, fontSize: '4rem', fontWeight: 600, color: T.teal, lineHeight: 1, marginBottom: '0.2rem' }
  const scLabel: CSSProperties = { fontSize: '0.75rem', color: T.muted, fontWeight: 500, marginBottom: '1.5rem' }
  const scBars: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.8rem' }
  const scBarMeta: CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: T.muted, marginBottom: '0.3rem' }
  const scBarTrack: CSSProperties = { height: 6, background: T.border, borderRadius: 10, overflow: 'hidden' }
  const scNote: CSSProperties = { marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: `1px solid ${T.border}`, fontSize: '0.95rem', color: T.text, lineHeight: 1.8 }

  const watermark: CSSProperties = { position: 'fixed', bottom: '0.5rem', right: '1rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', color: T.border, textTransform: 'uppercase' }

  return (
    <div style={layout}>
      <Sidebar />
      <main style={main}>

        {/* Header */}
        <div style={header}>
          <span style={{ color: T.teal, fontSize: '1.3rem', fontWeight: 700 }}>LangSolution</span>{' '}
          <span style={{ color: T.ink, fontSize: '1.3rem', fontWeight: 700 }}>Accent Clarity</span>{' '}
          <span style={{ opacity: 0.3, fontSize: '1rem' }}>›</span>{' '}
          <span style={{ fontSize: '0.85rem', color: T.muted, fontWeight: 400 }}>Welcome</span>
        </div>

        {/* ── WELCOME CARD ── */}
        <div style={wcGrid}>
          <div style={wcLeft}>
            <div style={wcTag}><div style={wcDot} /> Welcome Back</div>
            <div style={wcName}>Hello,<br /><strong style={{ fontWeight: 600, color: T.teal }}>{student.name.split(' ')[0]}.</strong></div>
            <div style={wcProf}>
              ⚖️ {student.profession}
              <div style={wcPdot} />
              {student.location}
              <div style={wcPdot} />
              Lesson {student.current_lesson} of {student.total_lessons}
            </div>

            {currentLesson?.teacher_note && (
              <div style={coachMsg}>
                <div style={coachLabel}>Coach Note</div>
                {currentLesson.teacher_note}
              </div>
            )}

            <div style={actions}>
              <Link href="/lesson" style={btnPrimary}>▶ Start Today&apos;s Lesson</Link>
              <Link href="/sounds" style={btnGhost}>📊 View My Progress</Link>
            </div>
          </div>

          <div style={wcRight}>
            <img src="/sherlen.jpg" alt="Sherlen Tanner" style={wcImg} />
            <div style={wcBadge}>
              <div style={badgeDot} />
              Sherlen Tanner — Your Coach
            </div>
          </div>
        </div>

        {/* ── PROGRESS CARD ── */}
        <div style={pcCard}>
          <div style={pcHeader}>
            <div>
              <div style={pcTitle}>Your {student.total_lessons}-Lesson Journey</div>
              <div style={pcSub}>{student.profession} · Courtroom Communication · Accent Clarity</div>
            </div>
            <Link href="/sounds" style={pcViewAll}>View All →</Link>
          </div>

          <div style={pcStats}>
            <div style={pcStat}><div style={pcStatNum()}>{completedCount}</div><div style={pcStatLabel}>Completed</div></div>
            <div style={pcStat}><div style={pcStatNum(T.gold)}>{remaining}</div><div style={pcStatLabel}>Remaining</div></div>
            <div style={pcStat}><div style={pcStatNum(T.success)}>{avgScore}%</div><div style={pcStatLabel}>Avg Score</div></div>
            <div style={pcStat}><div style={pcStatNum()}>{student.sessions_count}</div><div style={pcStatLabel}>Sessions</div></div>
          </div>

          <div style={pcBarWrap}>
            <div style={pcBarMeta}>
              <span style={pcBarLabel}>Overall Progress</span>
              <span style={pcBarPct}>{progressPct}% complete</span>
            </div>
            <div style={pcBarTrack}><div style={pcBarFill} /></div>
          </div>

          <div style={pcDots}>
            {dots.map(d => (
              <div key={d.n} style={dotStyle(d.state)} title={`Lesson ${d.n}`}>{d.n}</div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div style={grid}>

          {/* Lesson Card */}
          <div style={lcCard}>
            <div style={lcBar} />
            <div style={lcNum}>📍 Lesson {student.current_lesson} — Today</div>
            <div style={lcTitle}>{currentLesson?.title ?? 'Courtroom Communication'}</div>
            <div style={lcDesc}>
              {sentenceLines.length} sentences built from your last live session.
              {currentLesson?.focus_sounds?.length
                ? ` Focus on ${currentLesson.focus_sounds.join(', ')} in natural courtroom language.`
                : ''}
            </div>

            {sentenceLines.length > 0 && (
              <div style={lcSentences}>
                {sentenceLines.map((line, i) => (
                  <div key={i} style={lcSp}>
                    <div style={lcSpNum}>{i + 1}</div>
                    <div style={lcSpText} dangerouslySetInnerHTML={{ __html: hlMarkup(line) }} />
                  </div>
                ))}
              </div>
            )}

            <Link href="/lesson" style={lcBtn}>▶ Start Lesson {student.current_lesson}</Link>
          </div>

          {/* Score Card */}
          <div style={scCard}>
            <div style={scBig}>{avgScore}%</div>
            <div style={scLabel}>Average accuracy across all lessons</div>

            {Object.keys(soundsScores).length > 0 && (
              <div style={scBars}>
                {Object.entries(soundsScores).map(([sound, pct]) => (
                  <div key={sound}>
                    <div style={scBarMeta}>
                      <span>{sound} sound</span>
                      <span style={{ color: barColor(pct), fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={scBarTrack}>
                      <div style={{ height: '100%', borderRadius: 10, width: `${pct}%`, background: barColor(pct) }} />
                    </div>
                  </div>
                ))}
                {latestScore?.rhythm_score && (
                  <div>
                    <div style={scBarMeta}>
                      <span>Rhythm &amp; flow</span>
                      <span style={{ color: barColor(latestScore.rhythm_score), fontWeight: 600 }}>{latestScore.rhythm_score}%</span>
                    </div>
                    <div style={scBarTrack}>
                      <div style={{ height: '100%', borderRadius: 10, width: `${latestScore.rhythm_score}%`, background: barColor(latestScore.rhythm_score) }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentLesson?.teacher_note && (
              <div style={scNote}>
                <strong style={{ color: T.teal }}>Last session note from Sherlen:</strong>{' '}
                {currentLesson.teacher_note}
              </div>
            )}
          </div>
        </div>

      </main>
      <div style={watermark}>LANGSOLUTION ACCENT CLARITY</div>
    </div>
  )
}
