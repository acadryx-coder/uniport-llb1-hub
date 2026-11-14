import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/storage.js'

export default function MootTimer() {
  useDocumentTitle('Moot Timer')
  
  const PRESETS = [
    { label: 'Appellant (15m)', seconds: 15 * 60 },
    { label: 'Respondent (15m)', seconds: 15 * 60 },
    { label: 'Rebuttal (5m)', seconds: 5 * 60 },
    { label: 'Practice (10m)', seconds: 10 * 60 },
  ]

  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [totalTime, setTotalTime] = useState(15 * 60)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning])

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(totalTime)
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }
  
  const resetTimer = (seconds = totalTime) => {
    setIsRunning(false)
    setTimeLeft(seconds)
    setTotalTime(seconds)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const pct = (timeLeft / totalTime) * 100
  const isUrgent = timeLeft <= 60 && timeLeft > 0 // Last minute

  return (
    <div className="view">
      <Link to="/tools" className="back-btn">← All tools</Link>
      
      <div className="timer-container">
        <h2 className="section-title" style={{ margin: '0 0 4px' }}>Moot Court Timer</h2>
        <p className="mute-2" style={{ marginBottom: 24 }}>Precision timer for oral arguments and rebuttals.</p>
        
        <div className={`timer-display ${isRunning ? 'running' : ''} ${isUrgent ? 'urgent' : ''}`}>
          <div className="timer-time">{formatTime(timeLeft)}</div>
          <div className="timer-track"><i style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="timer-controls">
          <button className={`btn ${isUrgent ? 'btn-danger' : 'btn-gold'}`} onClick={toggleTimer}>
            {isRunning ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Start Timer'}
          </button>
          <button className="btn ghost" onClick={() => resetTimer()}>Reset</button>
        </div>

        <div className="timer-presets">
          {PRESETS.map(p => (
            <button key={p.label} className="btn ghost sm" onClick={() => resetTimer(p.seconds)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
