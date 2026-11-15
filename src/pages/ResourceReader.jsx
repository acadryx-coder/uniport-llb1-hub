import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useParams, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { parseLegalMD } from '../lib/markdown.js'
import { getProgress, saveProgress, useDocumentTitle } from '../lib/storage.js'
import { useAuth, setPendingRedirect } from '../lib/auth.js'
import QuizModal from '../components/QuizModal.jsx'

export default function ResourceReader() {
  const { courseSlug, resourceSlug } = useParams()
  const [course, setCourse] = useState(null)
  const [resource, setResource] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const bodyRef = useRef(null)
  const [pct, setPct] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(() => sessionStorage.getItem('llb1.previewDismissed') === 'true')
  
  const { user } = useAuth()
  const location = useLocation()

  useDocumentTitle(resource ? resource.name : 'Resource')

  useEffect(() => {
    supabase.from('courses').select('*').eq('slug', courseSlug).single().then(({ data: c }) => {
      setCourse(c)
      supabase.from('resources').select('*').eq('course_slug', courseSlug).eq('slug', resourceSlug).single().then(({ data: r }) => {
        setResource(r)
        if (r) {
          supabase.from('resource_chapters').select('*').eq('resource_id', r.id).order('order_index').then(({ data: chaps }) => {
            if (chaps && chaps.length > 0) setChapters(chaps)
            // Restore last read chapter if available
            const saved = getProgress(r.id)
            if (saved && saved.chapterIndex !== undefined && saved.chapterIndex < chaps.length) {
              setCurrentIndex(saved.chapterIndex)
            }
            setLoading(false)
          })
        } else {
          setLoading(false)
        }
      })
    })
  }, [courseSlug, resourceSlug])

  // Handle scroll tracking per chapter
  useEffect(() => {
    if (!resource || chapters.length === 0) return
    const el = bodyRef.current
    if (!el) return

    const saved = getProgress(resource.id)
    if (saved && saved.chapterIndex === currentIndex && typeof saved.scroll === 'number') {
      requestAnimationFrame(() => {
        el.scrollTop = saved.scroll
      })
    } else {
      el.scrollTop = 0
    }

    let timer = null
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100
      setPct(p)
      
      clearTimeout(timer)
      timer = setTimeout(() => {
        saveProgress(resource.id, {
          chapterIndex: currentIndex,
          scroll: el.scrollTop,
          pct: p,
          updated: Date.now()
        })
      }, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [currentIndex, chapters, resource])

  if (loading) return <div className="reader-page"><div className="empty">Loading resource…</div></div>
  if (!resource) return <div className="reader-page"><div className="empty">Not found.</div></div>

  const isPublicPreview = !user && resource.is_public
  const isBlocked = !user && !resource.is_public

  if (isBlocked) {
    setPendingRedirect(location.pathname + location.search)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  const currentChapter = chapters[currentIndex]
  const html = currentChapter ? parseLegalMD(currentChapter.content_md) : '<p>No content available.</p>'

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const dismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem('llb1.previewDismissed', 'true')
  }

  return (
    <div className="reader-page">
      <header className="reader-head">
        {user ? (
          <Link to={`/materials/${courseSlug}`} className="reader-back" aria-label="Back to course">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
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

      {isPublicPreview && !bannerDismissed && (
        <div className="reader-preview-banner">
          <div className="reader-preview-text">
            <strong>Preview Mode</strong>
            <span>Log in to unlock the full library.</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" state={{ from: location.pathname }} className="btn sm">Log in</Link>
            <button onClick={dismissBanner} className="btn ghost sm">Dismiss</button>
          </div>
        </div>
      )}

      <div className="reader-body" ref={bodyRef} style={{ paddingBottom: '100px' }}>
        {currentChapter ? (
          <div className="doc" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="empty">No chapters found for this resource.</div>
        )}
      </div>

      {/* Floating Buttons */}
      <div style={{ position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', right: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 50 }}>
        <button className="floating-quiz-btn" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-2)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={() => setShowTOC(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>
          Contents
        </button>
        {resource.quiz && (
          <button className="floating-quiz-btn" onClick={() => setShowQuiz(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Quiz
          </button>
        )}
      </div>

      {/* Bottom Next/Prev Navigation */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'var(--card)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40 }}>
        <button onClick={handlePrev} disabled={currentIndex === 0} className="btn ghost sm" style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>← Previous</button>
        <span className="mute-2" style={{ fontSize: '0.8rem' }}>{currentIndex + 1} / {chapters.length}</span>
        <button onClick={handleNext} disabled={currentIndex === chapters.length - 1} className="btn btn-gold sm" style={{ opacity: currentIndex === chapters.length - 1 ? 0.3 : 1 }}>Next →</button>
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
              {chapters.map((ch, i) => (
                <div 
                  key={ch.id} 
                  onClick={() => { setCurrentIndex(i); setShowTOC(false); }}
                  style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--line)', background: currentIndex === i ? 'var(--acc-soft)' : 'transparent', color: currentIndex === i ? 'var(--acc)' : 'var(--ink)', fontWeight: currentIndex === i ? 700 : 400 }}
                >
                  {ch.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <QuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} quiz={resource.quiz} resourceId={resource.id} />
    </div>
  )
}
