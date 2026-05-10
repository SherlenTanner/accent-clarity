'use client'

import { useState, useRef, useEffect } from 'react'

interface MicCheckProps {
  onPass: () => void
  onCancel: () => void
}

export default function MicCheck({ onPass, onCancel }: MicCheckProps) {
  type Stage = 'intro' | 'countdown' | 'recording' | 'playback' | 'troubleshoot'
  const [stage, setStage] = useState<Stage>('intro')
  const [countdown, setCountdown] = useState(3)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Countdown effect
  useEffect(() => {
    if (stage !== 'countdown') return
    if (countdown === 0) {
      startActualRecording()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [stage, countdown])

  async function beginCheck() {
    setError(null)
    setAudioUrl(null)
    setCountdown(3)
    setStage('countdown')
  }

  async function startActualRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(t => t.stop())
        setStage('playback')
      }

      mediaRecorder.start()
      setStage('recording')

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop()
      }, 5000)
    } catch (err: any) {
      setError('Could not access microphone. ' + (err.message || ''))
      setStage('troubleshoot')
    }
  }

  function confirmWorking() {
    try {
      localStorage.setItem('accentClarity_micCheckPassed', 'true')
    } catch {}
    onPass()
  }

  function reportNotWorking() {
    setStage('troubleshoot')
  }

  function tryAgain() {
    setAudioUrl(null)
    setError(null)
    setStage('intro')
  }

  // Shared modal wrapper
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(26, 26, 46, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 24,
      fontFamily: 'DM Sans, system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center'
      }}>
        {stage === 'intro' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
            <h2 style={{ fontSize: 22, color: '#1a7a7a', marginBottom: 12, fontWeight: 600 }}>
              Quick Mic Check
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
              Let&apos;s make sure your microphone is working before we start.<br/>
              You&apos;ll have 5 seconds to say something — anything! Then you&apos;ll hear it played back.
            </p>
            <button
              onClick={beginCheck}
              style={{
                width: '100%',
                padding: 14,
                background: '#1a7a7a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 10
              }}
            >
              Start Mic Check
            </button>
            <button
              onClick={onCancel}
              style={{
                width: '100%',
                padding: 10,
                background: 'transparent',
                color: '#888',
                border: 'none',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </>
        )}

        {stage === 'countdown' && (
          <>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>Get ready to speak...</p>
            <div style={{
              fontSize: 80,
              color: '#1a7a7a',
              fontWeight: 700,
              lineHeight: 1
            }}>
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </>
        )}

        {stage === 'recording' && (
          <>
            <div style={{
              fontSize: 48,
              marginBottom: 12,
              animation: 'pulse 1s infinite'
            }}>🔴</div>
            <h2 style={{ fontSize: 22, color: '#c0392b', marginBottom: 8, fontWeight: 600 }}>
              Recording...
            </h2>
            <p style={{ fontSize: 14, color: '#555' }}>
              Say something! Stops automatically in 5 seconds.
            </p>
          </>
        )}

        {stage === 'playback' && audioUrl && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔊</div>
            <h2 style={{ fontSize: 20, color: '#1a7a7a', marginBottom: 8, fontWeight: 600 }}>
              Here&apos;s your recording
            </h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              Press play to listen. Can you hear yourself clearly?
            </p>
            <audio controls src={audioUrl} autoPlay style={{ width: '100%', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmWorking}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#1a7a7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✓ Yes, I can hear it
              </button>
              <button
                onClick={reportNotWorking}
                style={{
                  flex: 1,
                  padding: 12,
                  background: 'white',
                  color: '#c0392b',
                  border: '1px solid #c0392b',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✗ I can&apos;t hear it
              </button>
            </div>
          </>
        )}

        {stage === 'troubleshoot' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <h2 style={{ fontSize: 20, color: '#c0392b', marginBottom: 12, fontWeight: 600 }}>
              Let&apos;s troubleshoot
            </h2>
            {error && (
              <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 16, padding: 10, background: '#fef2f2', borderRadius: 6 }}>
                {error}
              </p>
            )}
            <div style={{ textAlign: 'left', fontSize: 14, color: '#444', lineHeight: 1.8, marginBottom: 20 }}>
              <p style={{ marginBottom: 12, fontWeight: 600 }}>Try these steps:</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                <li>Check that your microphone is plugged in and turned on</li>
                <li>Click the lock icon 🔒 in the browser address bar and make sure Microphone is set to &ldquo;Allow&rdquo;</li>
                <li>Close other apps that might be using your mic (Zoom, FaceTime, etc.)</li>
                <li>Try a different browser (Chrome works best)</li>
              </ol>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={tryAgain}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#1a7a7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: 12,
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
