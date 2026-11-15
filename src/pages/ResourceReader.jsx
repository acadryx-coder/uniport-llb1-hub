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
  const [showTOC, setShowTOC] = useState(false)
  
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

  // Extract Table of Contents from Markdown
  const toc = useMemo(() => {
    if (!resource || !resource.md) return []
    const headings = []
    const lines = resource.md.split('\n')
    lines.forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2]
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        headings.push({ level, text, id })
      }
    })
    return headings
  }, [resource])

  const jumpToHeading = (id) => {
    setShowTOC(false)
    const el = document.getElementById(id)
    if (el) {
      // Scroll within the reader container
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
            <span>You're reading a public resource. Log in to unlock the full library.</span>
          </div>
          <Link to="/login" state={{ from: `/materials/${courseSlug}/${resourceSlug}` }} className="btn sm">
            Log in
          </Link>
        </div>
      )}

      <div className="reader-body" ref={bodyRef} style={{ paddingBottom: (resource.quiz || toc.length > 0) ? '120px' : '60px' }}>
        {issues.length > 0 && (
          <div className="reader-warn">
            <strong>Formatting check:</strong> {issues.length} issue{issues.length === 1 ? '' : 's'} in the source. First: {issues[0].issue}
          </div>
        )}
        <div className="doc" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Floating Buttons Container */}
      <div style={{ position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', right: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 50 }}>
        {toc.length > 0 && (
          <button className="floating-quiz-btn" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-2)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={() => setShowTOC(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Contents
          </button>
        )}
        
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
      </div>

      {/* TOC Modal */}
      {showTOC && (
        <div className="modal-backdrop" onClick={() => setShowTOC(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', padding: 0 }}>
            <div className="toc-head" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>Table of Contents</h3>
              <button className="icon-btn" onClick={() => setShowTOC(false)}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 0' }}>
              {toc.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => jumpToHeading(item.id)}
                  style={{ 
                    padding: `10px 20px`, 
                    paddingLeft: `${20 + (item.level - 1) * 16}px`,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--line)',
                    fontSize: item.level === 1 ? '1rem' : item.level === 2 ? '0.9rem' : '0.85rem',
                    fontWeight: item.level === 1 ? '700' : item.level === 2 ? '600' : '400',
                    color: item.level === 1 ? 'var(--acc)' : 'var(--ink)'
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
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
