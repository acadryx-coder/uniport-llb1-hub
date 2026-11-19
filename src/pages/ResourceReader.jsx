import { useEffect, useRef, useState } from 'react'
import { Link, useParams, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { parseLegalMD } from '../lib/markdown.js'
import { getProgress, saveProgress, useDocumentTitle } from '../lib/storage.js'
import { useAuth, setPendingRedirect } from '../lib/auth.js'
import QuizModal from '../components/QuizModal.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

function FloatingLogin({ onClick }) {
  const [pos, setPos] = useState({ x: 16, y: 80 })
  const [dragging, setDragging] = useState(false)
  const [rel, setRel] = useState({ x: 0, y: 0 })

  const onPointerDown = (e) => {
    setDragging(true)
    setRel({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    e.target.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragging) return
    setPos({ x: e.clientX - rel.x, y: e.clientY - rel.y })
  }
  const onPointerUp = (e) => {
    setDragging(false)
    e.target.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--acc)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 100, touchAction: 'none'
      }}
      title="Log in to save progress"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
  )
}

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
  
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem('llb1.previewDismissed') === 'true')
  
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
            let loadedChapters = chaps || []
            
            // FALLBACK: If no chapters exist, but there is markdown content, treat it as a single page
            if (loadedChapters.length === 0 && r.md) {
              loadedChapters = [{ id: 'single-page', title: r.name, content_md: r.md, order_index: 1 }]
            }

            setChapters(loadedChapters)

            const saved = getProgress(r.id)
            if (saved && saved.chapterIndex !== undefined && saved.chapterIndex < loadedChapters.length) {
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

  useEffect(() => {
    if (!resource || chapters.length === 0) return
    const el = bodyRef.current
    if (!el) return

    const saved = getProgress(resource.id)
    if (saved && saved.chapterIndex === currentIndex && typeof saved.scroll === 'number') {
      requestAnimationFrame(() => { el.scrollTop = saved.scroll })
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

  const handleNext = () => { if (currentIndex < chapters.length - 1) setCurrentIndex(currentIndex + 1) }
  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }

  const dismissBanner = () => {
    setBannerDismissed(true)
    localStorage.setItem('llb1.previewDismissed', 'true')
  }

  return (
    <div className="reader-page">
      <header className="reader-head">
        {user && (
          <Link to={`/materials/${courseSlug}`} className="reader-back" aria-label="Back to course" style={{ marginRight: '8px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
        )}
        
        <div className="reader-title-wrap" style={{ flex: 1, minWidth: 0 }}>
          <div className="reader-name" style={{ textAlign: 'left', lineHeight: 1.3 }}>{resource.name}</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
          <button onClick={() => setShowTOC(true)} className="btn sm" style={{ padding: '6px 10px', background: 'var(--card-2)', border: '1px solid var(--line-2)', color: 'var(--ink)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 4 }}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>
            TOC
          </button>
          <div className="reader-pct">{pct}%</div>
          <ThemeToggle />
        </div>
      </header>
      <div className="reader-prog"><i style={{ width: `${pct}%` }} /></div>

      {isPublicPreview && !bannerDismissed && (
        <div className="reader-preview-banner">
          <div className="reader-preview-text">
            <strong>Preview Mode</strong>
            <span>Log in to unlock the full library.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 8 }}>
            <Link to="/login" state={{ from: location.pathname }} className="btn sm">Log in</Link>
            <button onClick={dismissBanner} className="btn ghost sm">Dismiss</button>
          </div>
        </div>
      )}

      {isPublicPreview && bannerDismissed && (
        <FloatingLogin onClick={() => { setBannerDismissed(false); localStorage.removeItem('llb1.previewDismissed'); }} />
      )}

      <div className="reader-body" ref={bodyRef} style={{ paddingBottom: '100px' }}>
        {currentChapter ? (
          <div className="doc book-typography" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="empty">No content found for this resource.</div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', right: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 50 }}>
        {resource.quiz && (
          <button className="floating-quiz-btn" onClick={() => setShowQuiz(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Quiz
          </button>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'var(--card)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40 }}>
        <button onClick={handlePrev} disabled={currentIndex === 0} className="btn ghost sm" style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>← Previous</button>
        <span className="mute-2" style={{ fontSize: '0.8rem' }}>{chapters.length > 1 ? `${currentIndex + 1} / ${chapters.length}` : 'Single Page'}</span>
        <button onClick={handleNext} disabled={currentIndex === chapters.length - 1} className="btn btn-gold sm" style={{ opacity: currentIndex === chapters.length - 1 ? 0.3 : 1 }}>Next →</button>
      </div>

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
