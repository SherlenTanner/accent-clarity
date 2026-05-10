'use client'

import { useState, useRef } from 'react'

export default function MicTestPage() {
  const [status, setStatus] = useState('Ready to test')
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  async function startRecording() {
    setError(null)
    setAudioUrl(null)
    setStatus('Asking for microphone permission...')

    try {
      // Ask the browser for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      setStatus('Microphone access granted! Recording...')

      // Set up the recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Collect audio chunks as they come in
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // When recording stops, build the playback URL
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setStatus('✅ Recording complete! Play it below.')

        // Stop the microphone (turns off the mic indicator)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      setError(`Could not access microphone: ${err.message}`)
      setStatus('❌ Something went wrong')
      setIsRecording(false)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafb',
      padding: 24,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 24,
          color: '#1a7a7a',
          marginBottom: 8,
          fontWeight: 600
        }}>
          🎤 Microphone Test
        </h1>
        <p style={{
          fontSize: 14,
          color: '#666',
          marginBottom: 32
        }}>
          Let's make sure your microphone works before building the real thing.
        </p>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: '100%',
            padding: 16,
            background: isRecording ? '#c0392b' : '#1a7a7a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
        </button>

        <div style={{
          padding: 16,
          background: '#f8fafb',
          borderRadius: 8,
          fontSize: 14,
          color: '#333',
          marginBottom: 20
        }}>
          <strong>Status:</strong> {status}
        </div>

        {error && (
          <div style={{
            padding: 16,
            background: '#fee',
            color: '#c0392b',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {audioUrl && (
          <div style={{
            padding: 16,
            background: '#f0f9f9',
            border: '2px solid #1a7a7a',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <p style={{
              fontSize: 13,
              color: '#1a7a7a',
              marginBottom: 12,
              fontWeight: 600
            }}>
              ▶️ Your recording:
            </p>
            <audio controls src={audioUrl} style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  )
}
