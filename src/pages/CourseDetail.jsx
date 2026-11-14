import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getProgress, relDate, useDocumentTitle } from '../lib/storage.js'
import { TYPES, TYPE_BADGE } from '../data/seed.js'

const TYPE_ICONS = {
  'Note': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  'Past Q': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M9 10h.01"></path></svg>,
  'Textbook': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Statute': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  'Handout': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
}

function ResourceCard({ courseSlug, resource }) {
  const badge = TYPE_BADGE[resource.type] || 'note'
  const hasReader = !!resource.md
  const prog = getProgress(resource.id)
  const pct = prog ? prog.pct || 0 : 0
  const done = !!(prog && prog.complete)
  const icon = TYPE_ICONS[resource.type] || TYPE_ICONS['Note']

  // Calculate reading time for text, or use file size for PDFs
  let metaText = resource.size || ''
  if (hasReader) {
    const words = resource.md.split(/\s+/).length
    const minutes = Math.max(1, Math.ceil(words / 200)) // approx 200 wpm
    metaText = `${minutes} min read`
  }

  const inner = (
    <>
      <div className="res-card-top">
        <div className={`res-icon-box ${badge}`}>
          {icon}
        </div>
        <div className="res-meta-wrap">
          <span className={`res-type-pill ${badge}`}>{resource.type}</span>
          <span className="res-meta">{metaText} · {relDate(resource.date)}</span>
        </div>
      </div>
      
      <h3 className="res-card-title">{resource.name}</h3>
      
      {hasReader && pct > 0 && (
        <div className="res-bar" style={{ marginTop: 'auto', marginBottom: 12 }}>
          <i style={{ width: `${pct}%` }} />
          <span className="res-bar-text">{pct}% complete</span>
        </div>
      )}
      
      <div className="res-card-action">
        <span className={`res-action-btn ${hasReader ? 'primary' : 'download'}`}>
          {hasReader ? (done ? 'Read Again' : pct > 0 ? 'Continue Reading' : 'Read Material') : 'Download File'}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {hasReader ? <path d="M5 12h14M12 5l7 7-7 7"/> : <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>}
          </svg>
        </span>
      </div>
    </>
  )

  if (hasReader) {
    return (
      <Link to={`/materials/${courseSlug}/${resource.slug}`} className="res-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </Link>
    )
  }
  return (
    <a 
      href={resource.file_url || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="res-card" 
      style={{ textDecoration: 'none', color: 'inherit' }}
      onClick={(e) => { if (!resource.file_url) { e.preventDefault(); alert('No file URL attached.'); } }}
    >
      {inner}
    </a>
  )
}

export default function CourseDetail() {
  const { courseSlug } = useParams()
  const [course, setCourse] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')

  useDocumentTitle(course ? course.code : 'Course')

  useEffect(() => {
    supabase.from('courses').select('*').eq('slug', courseSlug).single().then(({ data }) => {
      setCourse(data)
      supabase.from('resources').select('*').eq('course_slug', courseSlug).then(({ data: res }) => {
        if (res) setResources(res)
        setLoading(false)
      })
    })
  }, [courseSlug])

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources
      .filter((r) => type === 'all' || r.type === type)
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [resources, type, query])

  if (loading) return <div className="view"><div className="empty">Loading course…</div></div>

  if (!course) return <div className="view"><Link to="/materials" className="back-btn">← All courses</Link><div className="empty">Course not found.</div></div>

  return (
    <div className="view">
      <Link to="/materials" className="back-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        All courses
      </Link>
      
      <div className="mat-course-head">
        <div className="course-code">{course.code}</div>
        <div className="course-title">{course.title}</div>
        <div className="mute-2">{course.lecturer} · {course.units} units</div>
      </div>
      
      <div className="search">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder={`Search in ${course.code}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search course materials"
        />
      </div>
      
      <div className="filters">
        {TYPES.map((t) => {
          const count = t.key === 'all' ? resources.length : resources.filter((r) => r.type === t.key).length
          const isActive = type === t.key
          return (
            <button
              key={t.key}
              className={isActive ? 'on' : ''}
              onClick={() => setType(t.key)}
              disabled={t.key !== 'all' && count === 0 && !isActive}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      
      {filteredList.length === 0 ? (
        <div className="empty">No files match your filters.</div>
      ) : (
        <div className="res-grid">
          {filteredList.map((r) => <ResourceCard key={r.id} courseSlug={courseSlug} resource={r} />)}
        </div>
      )}
    </div>
  )
}
