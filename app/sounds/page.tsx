'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Sound {
  id: string
  ipa: string
  name: string
  examples: string[]
  category: 'consonant' | 'vowel'
  status: 'current' | 'done' | ''
  title: string
  subtitle: string
  tags: { label: string; variant?: string }[]
  tabs: SoundTab[]
}

interface SoundTab {
  id: string
  label: string
  anatomy: string
  tips: { label: string; text: string; variant?: string }[]
}

const SOUNDS: Sound[] = [
  {
    id: 'th-voiceless',
    ipa: '/θ/',
    name: 'Voiceless TH',
    examples: ['think', 'three', 'therapy'],
    category: 'consonant',
    status: 'current',
    title: 'The TH Sounds — Voiceless & Voiced',
    subtitle: 'The most challenging sound for Spanish speakers — and the most common in legal English.',
    tags: [
      { label: '⚖️ Legal' },
      { label: '🏥 Healthcare' },
      { label: '⭐ High Priority', variant: 'gold' },
    ],
    tabs: [
      {
        id: 'voiceless',
        label: '/θ/ — Voiceless TH',
        anatomy: 'Tongue touches upper teeth, no vibration',
        tips: [
          { label: 'How to Produce It', text: 'Place the tip of your tongue lightly between your upper and lower teeth. Push air through without vibrating your vocal cords. The sound is like a soft "s" with the tongue forward.' },
          { label: 'The Finger Test', text: 'Hold a finger in front of your lips. You should feel a puff of air — no vibration. Say "think" — you should feel air on your finger.' },
          { label: 'Legal Context', text: 'Critical words: "the court", "therefore", "threshold", "the defendant", "three counts". These appear in every hearing.' },
          { label: 'Healthcare Context', text: 'Key words: "therapy", "thigh", "thoracic", "three times daily". Misproducing TH can cause serious miscommunication.', variant: 'gold' },
        ],
      },
      {
        id: 'voiced',
        label: '/ð/ — Voiced TH',
        anatomy: 'Tongue touches upper teeth, voice vibrates',
        tips: [
          { label: 'How to Produce It', text: 'Same tongue position as /θ/, but now add voice — vibrate your vocal cords. Place a hand on your throat to feel the vibration. Say "the", "this", "that", "there".' },
          { label: 'The Humming Test', text: 'Start humming "mmm", then slowly push your tongue between your teeth. You should produce /ð/ naturally.' },
          { label: 'Legal Context', text: '"The defendant", "therefore", "this evidence", "that testimony", "the charges". Most function words in English use /ð/.' },
          { label: 'Common Confusions', text: 'Many Spanish speakers produce "d" or "z" instead — "de court" or "ze court". Practice slowly: the — the — the.', variant: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'r',
    ipa: '/r/',
    name: 'The R Sound',
    examples: ['right', 'represent', 'argue'],
    category: 'consonant',
    status: 'done',
    title: 'The American R Sound',
    subtitle: 'The retroflex R is unique to American English — curled tongue, never trilled.',
    tags: [
      { label: '⚖️ Legal' },
      { label: '⭐ High Priority', variant: 'gold' },
    ],
    tabs: [
      {
        id: 'r-main',
        label: '/r/ — The R Sound',
        anatomy: 'Tongue curves back, does not touch the roof',
        tips: [
          { label: 'How to Produce It', text: 'Curl the tip of your tongue back slightly — it should NOT touch the roof of your mouth. Tense the sides of your tongue against your upper back teeth.' },
          { label: 'The Key Difference', text: 'Spanish /r/ is trilled or tapped. English /r/ is smooth and continuous. Think of pulling the tongue back, not flipping it.' },
          { label: 'Legal Context', text: '"Right", "represent", "rights", "ruling", "require", "record", "residence". The /r/ is everywhere in legal vocabulary.' },
          { label: 'Practice Sequence', text: 'Start with "rrr..." (hold it), then "right", "represent", "I represent my client in this matter."', variant: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'v',
    ipa: '/v/',
    name: 'The V Sound',
    examples: ['voice', 'violation', 'evidence'],
    category: 'consonant',
    status: '',
    title: 'The V Sound',
    subtitle: 'Upper teeth on lower lip — a voiced sound often confused with /b/ in Spanish.',
    tags: [{ label: '⚖️ Legal' }],
    tabs: [
      {
        id: 'v-main',
        label: '/v/ — V Sound',
        anatomy: 'Upper teeth on lower lip, voiced',
        tips: [
          { label: 'How to Produce It', text: 'Place your upper front teeth gently on your lower lip. Make the "v" sound with vibration — not a "b" or "w".' },
          { label: 'Legal Context', text: '"Evidence", "violation", "victim", "verdict", "voice", "valid". The V sound is critical in legal vocabulary.' },
          { label: 'Common Error', text: 'Many Spanish speakers say "b" instead — "ebidence" instead of "evidence". Feel the teeth touching the lip.', variant: 'gold' },
          { label: 'Practice', text: 'VVV... van, vet, vow. "The evidence is valid and verified."' },
        ],
      },
    ],
  },
  {
    id: 'w',
    ipa: '/w/',
    name: 'The W Sound',
    examples: ['witness', 'withdraw', 'warrant'],
    category: 'consonant',
    status: '',
    title: 'The W Sound',
    subtitle: 'Rounded lips with voice — similar to /u/ but moving into a vowel.',
    tags: [{ label: '⚖️ Legal' }],
    tabs: [
      {
        id: 'w-main',
        label: '/w/ — W Sound',
        anatomy: 'Rounded lips, voiced glide',
        tips: [
          { label: 'How to Produce It', text: 'Round your lips tightly as if saying "oo", then quickly open into the next vowel. It\'s a glide — a moving sound.' },
          { label: 'Legal Context', text: '"Witness", "warrant", "withdraw", "waive", "wrongful". Every court case involves witnesses and warrants.' },
          { label: 'Practice', text: '"The witness will withdraw." "A valid warrant was issued."' },
          { label: 'Note', text: 'Unlike Spanish, English /w/ is not spelled with "u" in most cases. "Guantánamo" vs "witness" — different sounds.', variant: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'ae',
    ipa: '/æ/',
    name: 'Short A',
    examples: ['act', 'damage', 'statute'],
    category: 'vowel',
    status: '',
    title: 'The Short A — /æ/',
    subtitle: 'A low front vowel — wider mouth than Spanish /a/, jaw drops down.',
    tags: [{ label: '⚖️ Legal' }],
    tabs: [
      {
        id: 'ae-main',
        label: '/æ/ — Short A',
        anatomy: 'Jaw drops, tongue low and forward',
        tips: [
          { label: 'How to Produce It', text: 'Open your jaw more than for Spanish /a/. The tongue sits low and forward in the mouth. Think of the "a" in "cat".' },
          { label: 'Legal Context', text: '"Act", "damage", "statute", "facts", "chapter", "patent". The short A appears constantly in legal text.' },
          { label: 'Practice', text: '"The Facts of the Case Act." Say each word slowly: facts — act — damage — statute.' },
          { label: 'Distinction', text: 'English "bad" /bæd/ vs. Spanish "bado" — the vowel quality is different. Your jaw should drop noticeably.', variant: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'aa',
    ipa: '/ɑː/',
    name: 'Long A (AH)',
    examples: ['law', 'clause', 'court'],
    category: 'vowel',
    status: '',
    title: 'The AH Sound — /ɑː/',
    subtitle: 'A long back vowel — similar to an open "ah", used in "law", "court", "clause".',
    tags: [{ label: '⚖️ Legal' }],
    tabs: [
      {
        id: 'aa-main',
        label: '/ɑː/ — Long AH',
        anatomy: 'Jaw wide open, tongue back and low',
        tips: [
          { label: 'How to Produce It', text: 'Open wide — like a doctor asking you to say "ahh". Tongue is back and low. Lips slightly rounded for /ɔː/ variant (as in "law").' },
          { label: 'Legal Context', text: '"Law", "court", "clause", "fraud", "caused", "fault", "clause". These are core legal vocabulary words.' },
          { label: 'Practice', text: '"The law of the court." "A cause of action." "No-fault clause."' },
          { label: 'Caution', text: 'Don\'t confuse with /æ/ (short A) — "law" is /lɑː/, not /læ/. The back position matters.', variant: 'gold' },
        ],
      },
    ],
  },
]

const PRACTICE_WORDS: Record<string, { word: string; context: string }[]> = {
  'th-voiceless': [
    { word: 'therapy',    context: 'Healthcare' },
    { word: 'threshold',  context: 'Legal' },
    { word: 'the court',  context: 'Legal' },
    { word: 'therefore',  context: 'Legal' },
    { word: 'breathe',    context: 'Voiced TH' },
    { word: 'three',      context: 'Number' },
  ],
  r: [
    { word: 'represent',    context: 'Legal' },
    { word: 'rights',       context: 'Legal' },
    { word: 'ruling',       context: 'Legal' },
    { word: 'record',       context: 'Legal' },
    { word: 'residency',    context: 'Immigration' },
    { word: 'reasonable',   context: 'Legal' },
  ],
  v: [
    { word: 'evidence',   context: 'Legal' },
    { word: 'verdict',    context: 'Legal' },
    { word: 'violation',  context: 'Legal' },
    { word: 'valid',      context: 'Legal' },
    { word: 'victim',     context: 'Legal' },
    { word: 'voice',      context: 'General' },
  ],
  w: [
    { word: 'witness',    context: 'Legal' },
    { word: 'warrant',    context: 'Legal' },
    { word: 'withdraw',   context: 'Legal' },
    { word: 'waive',      context: 'Legal' },
    { word: 'wrongful',   context: 'Legal' },
    { word: 'written',    context: 'Legal' },
  ],
  ae: [
    { word: 'act',      context: 'Legal' },
    { word: 'facts',    context: 'Legal' },
    { word: 'damage',   context: 'Legal' },
    { word: 'statute',  context: 'Legal' },
    { word: 'chapter',  context: 'Legal' },
    { word: 'patent',   context: 'Legal' },
  ],
  aa: [
    { word: 'law',    context: 'Legal' },
    { word: 'court',  context: 'Legal' },
    { word: 'clause', context: 'Legal' },
    { word: 'fraud',  context: 'Legal' },
    { word: 'cause',  context: 'Legal' },
    { word: 'fault',  context: 'Legal' },
  ],
}

export default function SoundsPage() {
  const [activeSound, setActiveSound] = useState<Sound>(SOUNDS[0])
  const [activeTab, setActiveTab]     = useState<string>(SOUNDS[0].tabs[0].id)
  const [recording, setRecording]     = useState(false)

  const consonants = SOUNDS.filter(s => s.category === 'consonant')
  const vowels     = SOUNDS.filter(s => s.category === 'vowel')

  const handleSelectSound = (sound: Sound) => {
    setActiveSound(sound)
    setActiveTab(sound.tabs[0].id)
    setRecording(false)
  }

  const activeTabData = activeSound.tabs.find(t => t.id === activeTab) ?? activeSound.tabs[0]
  const practiceWords = PRACTICE_WORDS[activeSound.id] ?? []

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="brand-bar">
          <span className="brand-title">LangSolution Accent Clarity</span>
        </div>

        <div className="breadcrumb">
          <span>LangSolution</span>
          <span className="breadcrumb-sep">›</span>
          <span>Accent Clarity</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">Sound Library</span>
        </div>

        <div className="page-header-section">
          <div className="page-title">Pronunciation Sound Library</div>
          <div className="page-subtitle">
            Study individual sounds — diagrams, audio examples, and practice words for your profession.
          </div>
        </div>

        <div className="sound-library">

          {/* Sound List */}
          <div className="sound-list">
            <div className="sound-list-header">🔤 Sounds</div>

            <div className="sound-category-label">Consonant Sounds</div>
            {consonants.map(s => (
              <div
                key={s.id}
                className={`sound-item ${activeSound.id === s.id ? 'active' : ''}`}
                onClick={() => handleSelectSound(s)}
              >
                <div className="sound-ipa">{s.ipa}</div>
                <div className="sound-info">
                  <div className="sound-name">{s.name}</div>
                  <div className="sound-words">{s.examples.join(', ')}</div>
                </div>
                {s.status && (
                  <div className={`sound-badge ${s.status}`}>
                    {s.status === 'done' ? '✓' : 'Active'}
                  </div>
                )}
              </div>
            ))}

            <div className="sound-category-label">Vowel Sounds</div>
            {vowels.map(s => (
              <div
                key={s.id}
                className={`sound-item ${activeSound.id === s.id ? 'active' : ''}`}
                onClick={() => handleSelectSound(s)}
              >
                <div className="sound-ipa">{s.ipa}</div>
                <div className="sound-info">
                  <div className="sound-name">{s.name}</div>
                  <div className="sound-words">{s.examples.join(', ')}</div>
                </div>
                {s.status && (
                  <div className={`sound-badge ${s.status}`}>
                    {s.status === 'done' ? '✓' : 'Active'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sound Lesson Detail */}
          <div className="sound-lesson">

            {/* Header */}
            <div className="sound-header">
              <div className="sound-hero-ipa">{activeSound.ipa}</div>
              <div className="sound-hero-title">{activeSound.title}</div>
              <div className="sound-hero-sub">{activeSound.subtitle}</div>
              <div className="sound-tags">
                {activeSound.tags.map((t, i) => (
                  <span key={i} className={`sound-tag ${t.variant ?? ''}`}>{t.label}</span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-switcher">
              {activeSound.tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content grid */}
            <div className="content-grid">
              <div className="anatomy-card">
                <div className="anatomy-placeholder">
                  <div className="ap-icon">👄</div>
                  <div className="ap-label">{activeTabData.anatomy}</div>
                </div>
              </div>
              <div className="desc-card">
                {activeTabData.tips.map((tip, i) => (
                  <div key={i} className={`tip-box ${tip.variant ?? ''}`}>
                    <div className="tip-label">{tip.label}</div>
                    <div className="tip-text">{tip.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio examples */}
            <div className="audio-card">
              <div className="section-label">🔊 Listen to Examples</div>
              {[
                { title: 'Isolated sound',          context: 'Slow, clear pronunciation', speed: '0.75×' },
                { title: 'Healthcare sentence',      context: 'Clinical context',          speed: '1.0×'  },
                { title: 'Legal sentence',           context: 'Courtroom context',         speed: '1.0×'  },
              ].map((row, i) => (
                <div className="audio-row" key={i}>
                  <button className="play-btn" title="Play" aria-label={`Play ${row.title}`}>▶</button>
                  <div className="audio-info">
                    <div className="audio-title">{row.title}</div>
                    <div className="audio-context">{row.context}</div>
                  </div>
                  <div className="audio-progress" />
                  <span className="speed-tag">{row.speed}</span>
                </div>
              ))}
            </div>

            {/* Practice words */}
            {practiceWords.length > 0 && (
              <div className="words-card">
                <div className="section-label">🗣️ Practice Words — Click to Hear</div>
                <div className="words-grid">
                  {practiceWords.map((w, i) => (
                    <div className="word-item" key={i}>
                      <div>
                        <div className="word-text">{w.word}</div>
                        <div className="word-context">{w.context}</div>
                      </div>
                      <button className="play-btn" style={{ width: 30, height: 30, fontSize: '0.75rem' }} aria-label={`Play ${w.word}`}>▶</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Record yourself */}
            <div className="record-card">
              <div className="section-label">🎙️ Record Yourself</div>
              <div className="record-instruction">
                Read the words below aloud, focusing on the {activeSound.ipa} sound.
                Record yourself, then compare to the examples above.
              </div>
              <div className="record-words-list">
                {practiceWords.slice(0, 6).map((w, i) => (
                  <span key={i} className="record-word">{w.word}</span>
                ))}
              </div>

              {recording && (
                <div className="waveform">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="wave-bar" />
                  ))}
                </div>
              )}

              {!recording ? (
                <button className="btn-record" onClick={() => setRecording(true)}>
                  🎙️ Start Recording
                </button>
              ) : (
                <button className="btn-stop" onClick={() => setRecording(false)}>
                  ⏹ Stop &amp; Get Feedback
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
      <div className="watermark">LangSolution · Accent Clarity</div>
    </div>
  )
}
