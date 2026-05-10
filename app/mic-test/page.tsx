'use client'
import { useState, useRef } from 'react'

export default function MicTestPage() {
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [status, setStatus] = useState('Ready to test')
  const [level, setLevel] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)

  const startRecording = async () => {
    try {
      setStatus('Asking for microphone permission…')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up level meter
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setLevel(avg)
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Set up recorder
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
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
        setLevel(0)
        setStatus('✅ Your microphone works! Play your recording below.')
      }

      recorder.start()
      setRecording(true)
      setRecordedUrl(null)
      setStatus('🎙️ Recording — speak now!')
    } catch (err: any) {
      console.error('Mic error:', err)
      setStatus('⚠️ Could not access microphone. ' + (err?.message || ''))
      alert('Microphone access denied or unavailable.\n\nMake sure you clicked Allow when Chrome asked for microphone permission.\n\nTo fix: click the lock icon in the address bar → Site settings → Microphone → Allow → reload this page.')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setRecording(false)
  }

  const reset = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
    setStatus('Ready to test')
  }

  // Level meter bars
  const bars = Array.from({ length: 20 }, (_, i) => {
    const threshold = (i + 1) * 5
    const active = level > threshold
    return active
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafb 0%, #e8f5f5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '3rem 2.5rem',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(26,122,122,0.12)',
        border: '1px solid rgba(26,122,122,0.1)',
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#1a7a7a',
          fontSize: '1.8rem',
          fontWeight: 700,
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em',
        }}>
          🎤 Microphone Test
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          lineHeight: 1.5,
        }}>
          Let's make sure your microphone works before your first recording.
        </p>

        {/* Level meter */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '3px',
          height: '50px',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
        }}>
          {bars.map((active, i) => (
            <div key={i} style={{
              width: '8px',
              height: `${10 + i * 2}px`,
              background: active ? (i > 12 ? '#ef4444' : i > 8 ? '#c9a84c' : '#1a7a7a') : '#e5e7eb',
              borderRadius: '2px',
              transition: 'background 0.05s',
            }} />
          ))}
        </div>

        {/* Main button */}
        {!recording && (
          <button
            type="button"
            onClick={startRecording}
            style={{
              width: '100%',
              padding: '1.1rem',
              background: '#1a7a7a',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '1rem',
            }}
          >
            🎤 Start Recording
          </button>
        )}

        {recording && (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              width: '100%',
              padding: '1.1rem',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '1rem',
            }}
          >
            ⏹ Stop Recording
          </button>
        )}

        {/* Status */}
        <div style={{
          background: '#f8fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '0.9rem 1rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#2d2d2d',
          marginBottom: recordedUrl ? '1rem' : 0,
        }}>
          <strong style={{ color: '#1a7a7a' }}>Status:</strong> {status}
        </div>

        {/* Playback */}
        {recordedUrl && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              ▶ Your recording — press play to hear yourself:
            </div>
            <audio
              controls
              src={recordedUrl}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <button
              type="button"
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: '#fff',
                color: '#1a7a7a',
                border: '1px solid #1a7a7a',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔄 Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
