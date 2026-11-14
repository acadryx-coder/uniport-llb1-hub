import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.js'

export default function QuizModal({ isOpen, onClose, quiz, resourceId }) {
  const { user } = useAuth()
  
  const [pastScores, setPastScores] = useState([])
  const [sessionScores, setSessionScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)
  
  const [step, setStep] = useState('intro') // 'intro' | 'taking' | 'results'
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [finalScore, setFinalScore] = useState(0)

  const activeQuiz = Array.isArray(quiz) ? quiz[0] : quiz

  // Load past scores from Supabase on open
  useEffect(() => {
    if (isOpen && activeQuiz && user) {
      setLoadingScores(true)
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setPastScores(data)
          setLoadingScores(false)
        })
    }
    
    if (isOpen) {
      setStep('intro')
      setCurrentQ(0)
      setAnswers({})
      setFinalScore(0)
    }
  }, [isOpen, activeQuiz, resourceId, user])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen || !activeQuiz || !activeQuiz.questions) return null

  const displayScores = user ? pastScores : sessionScores

  const handleStart = () => {
    setStep('taking')
    setCurrentQ(0)
    setAnswers({})
  }

  const handleSelect = (optIndex) => {
    setAnswers({ ...answers, [currentQ]: optIndex })
  }

  const handleNext = () => {
    if (currentQ < activeQuiz.questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    let correct = 0
    activeQuiz.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++
    })
    
    const pct = Math.round((correct / activeQuiz.questions.length) * 100)
    setFinalScore(pct)
    
    const newScore = {
      score: pct,
      correct,
      total: activeQuiz.questions.length,
      created_at: new Date().toISOString()
    }

    if (user) {
      // Save to Supabase
      const { error } = await supabase.from('quiz_attempts').insert([{
        user_id: user.id,
        resource_id: resourceId,
        score: pct,
        total: activeQuiz.questions.length
      }])
      
      if (!error) {
        // Refresh local list of scores
        setPastScores([newScore, ...pastScores].slice(0, 5))
      } else {
        console.error("Failed to save score to DB:", error)
      }
    } else {
      // Save to session state for guests
      setSessionScores([newScore, ...sessionScores].slice(0, 5))
    }
    
    setStep('results')
  }

  const q = activeQuiz.questions[currentQ]
  const isAnswered = answers[currentQ] !== undefined
  const attemptNumber = displayScores.length + 1

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content quiz-modal" onClick={(e) => e.stopPropagation()}>
        
        {step === 'intro' && (
          <div className="quiz-intro">
            <div className="quiz-header">
              <h2>{activeQuiz.title}</h2>
              <button className="icon-btn" onClick={onClose}>×</button>
            </div>
            <p className="quiz-desc">{activeQuiz.description}</p>
            
            <div className="quiz-note">
              <strong>Note:</strong> This is a self-assessment tool.
              {!user && ' Since you are not logged in, these scores will only last until you close this page.'}
            </div>

            {loadingScores ? (
              <div className="mute-2" style={{ marginTop: 12 }}>Loading scores…</div>
            ) : displayScores.length > 0 && (
              <div className="quiz-history">
                <h4>Recent Scores {!user && '(This Session)'}</h4>
                {displayScores.map((s, i) => (
                  <div key={i} className="quiz-history-row">
                    <span>{new Date(s.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                    <span className="quiz-history-score">{s.correct}/{s.total} ({s.score}%)</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-gold" style={{ width: '100%', marginTop: 20 }} onClick={handleStart}>
              Start {attemptNumber === 1 ? '1st' : attemptNumber === 2 ? '2nd' : attemptNumber === 3 ? '3rd' : `${attemptNumber}th`} attempt
            </button>

            {!user && (
              <div className="quiz-login-prompt">
                Want to save your scores and track your progress? <Link to="/login">Log in here</Link>
              </div>
            )}
          </div>
        )}

        {step === 'taking' && (
          <div className="quiz-taking">
            <div className="quiz-header">
              <div className="quiz-progress-text">Question {currentQ + 1} of {activeQuiz.questions.length}</div>
              <button className="icon-btn" onClick={onClose}>×</button>
            </div>
            
            <div className="quiz-progress-bar">
              <i style={{ width: `${((currentQ + 1) / activeQuiz.questions.length) * 100}%` }} />
            </div>

            <h3 className="quiz-q">{q.q}</h3>
            
            <div className="quiz-options">
              {q.options.map((opt, i) => (
                <button 
                  key={i} 
                  className={`quiz-opt ${answers[currentQ] === i ? 'selected' : ''}`}
                  onClick={() => handleSelect(i)}
                >
                  <div className="quiz-opt-radio" />
                  {opt}
                </button>
              ))}
            </div>

            <button 
              className="btn btn-gold" 
              style={{ width: '100%', marginTop: 20 }} 
              disabled={!isAnswered}
              onClick={handleNext}
            >
              {currentQ === activeQuiz.questions.length - 1 ? 'Submit Answers' : 'Next Question'}
            </button>
          </div>
        )}

        {step === 'results' && (
          <div className="quiz-results">
            <div className="quiz-header">
              <h2>Results</h2>
              <button className="icon-btn" onClick={onClose}>×</button>
            </div>
            
            <div className="quiz-score-circle" style={{
              borderColor: finalScore >= 70 ? 'var(--ok)' : finalScore >= 40 ? 'var(--warn)' : 'var(--danger)',
              color: finalScore >= 70 ? 'var(--ok)' : finalScore >= 40 ? 'var(--warn)' : 'var(--danger)'
            }}>
              <span className="score-num">{finalScore}%</span>
              <span className="score-lab">Score</span>
            </div>

            <div className="quiz-feedback">
              {finalScore >= 80 ? 'Outstanding! You have a strong grasp of this material.' :
               finalScore >= 60 ? 'Good job. Review the questions you missed to fully lock it in.' :
               finalScore >= 40 ? 'Fair attempt. You should re-read the material and try again.' :
               'You need to review this material more carefully before the exam.'}
            </div>

            {!user && (
              <div className="quiz-login-prompt" style={{ marginTop: -8, marginBottom: 20 }}>
                <strong>Score not saved.</strong> <Link to="/login">Log in</Link> to track your progress and keep a history.
              </div>
            )}

            <div className="quiz-actions">
              <button className="btn ghost" onClick={onClose}>Close</button>
              <button className="btn btn-gold" onClick={handleStart}>Try Again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
