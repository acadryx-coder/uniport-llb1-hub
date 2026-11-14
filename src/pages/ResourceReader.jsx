import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useParams, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { parseLegalMD, validateMD } from '../lib/markdown.js'
import { getProgress, saveProgress, useDocumentTitle } from '../lib/storage.js'
import { useAuth, setPendingRedirect } from '../lib/auth.js'
import QuizModal from '../components/QuizModal.jsx'

export default function ResourceReader() {
  const { courseSlug, resourceSlug } = useParams()
  const [course, setCourse] = useState(null)
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)

  const bodyRef = useRef(null)
  const [pct, setPct] = useState(0)
  const [issues, setIssues] = useState([])
  const [showQuiz, setShowQuiz] = useState(false)
  
  const { user } = useAuth()
  const location = useLocation()

  useDocumentTitle(resource ? resource.name : 'Resource')

  useEffect(() => {
    supabase.from('courses').select('*').eq('slug', courseSlug).single().then(({ data: c }) => {
      setCourse(c)
      supabase.from('resources').select('*').eq('course_slug', courseSlug).eq('slug', resourceSlug).single().then(({ data: r }) => {
        setResource(r)
        if (r && r.md) setIssues(validateMD(r.md))
        setLoading(false)
      })
    })
  }, [courseSlug, resourceSlug])

  // Restore scroll position for EVERYONE (guests and logged-in)
  useEffect(() => {
    if (!resource) return
    const el = bodyRef.current
    if (!el) return
    const saved = getProgress(resource.id)
    
    requestAnimationFrame(() => {
      el.scrollTop = saved && typeof saved.scroll === 'number' ? saved.scroll : 0
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100
      setPct(p)
    })
  }, [resource])

  // Track and save scroll position for EVERYONE
  useEffect(() => {
    if (!resource) return
    let timer = null
    const el = bodyRef.current
    if (!el) return

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100
      setPct(p)
      
      clearTimeout(timer)
      timer = setTimeout(() => {
        saveProgress(resource.id, {
          scroll: el.scrollTop,
          pct: p,
          updated: Date.now(),
          complete: p >= 95
        })
      }, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [resource])

  if (loading) return <div className="reader-page"><div className="empty">Loading resource…</div></div>

  if (!resource || !resource.md) {
    return (
      <div className="reader-page">
        <header className="reader-head">
          <Link to={`/materials/${courseSlug || ''}`} className="reader-back" aria-label="Back">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="reader-title-wrap">
            <div className="reader-course">Resource</div>
            <div className="reader-name">Not available</div>
          </div>
          <div className="reader-pct">—</div>
        </header>
        <div className="reader-body">
          <div className="empty">This resource is not available in the reader.</div>
        </div>
      </div>
    )
  }

  const isPublicPreview = !user && resource.is_public
  const isBlocked = !user && !resource.is_public

  if (isBlocked) {
    setPendingRedirect(location.pathname + location.search)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  const html = parseLegalMD(resource.md)

  return (
    <div className="reader-page">
      <header className="reader-head">
        {user ? (
          <Link to={`/materials/${courseSlug}`} className="reader-back" aria-label="Back to course">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : (
          <div style={{ width: 36, flex: '0 0 36px' }} />
        )}
        <div className="reader-title-wrap">
          <div className="reader-course">{course?.code} · {resource.type}</div>
          <div className="reader-name">{resource.name}</div>
        </div>
        <div className="reader-pct">{pct}%</div>
      </header>
      <div className="reader-prog"><i style={{ width: `${pct}%` }} /></div>

      {isPublicPreview && (
        <div className="reader-preview-banner">
          <div className="reader-preview-text">
            <strong>Preview Mode</strong>
            <span>You're reading a public resource. Log in to unlock the full library, timetable, and class tools.</span>
          </div>
          <Link to="/login" state={{ from: `/materials/${courseSlug}/${resourceSlug}` }} className="btn sm">
            Log in
          </Link>
        </div>
      )}

      <div className="reader-body" ref={bodyRef} style={{ paddingBottom: resource.quiz ? '100px' : '60px' }}>
        {issues.length > 0 && (
          <div className="reader-warn">
            <strong>Formatting check:</strong> {issues.length} issue{issues.length === 1 ? '' : 's'} in the source. First: {issues[0].issue}
          </div>
        )}
        <div className="doc" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {resource.quiz && (
        <button className="floating-quiz-btn" onClick={() => setShowQuiz(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Quiz
        </button>
      )}

      <QuizModal 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        quiz={resource.quiz} 
        resourceId={resource.id} 
      />
    </div>
  )
}
