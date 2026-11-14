import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourses } from '../lib/hooks.js'
import { useDocumentTitle } from '../lib/storage.js'

// A muted, academic palette distinct from the primary brand color
const COLORS = [
  '#2C3E50', // LAW 101 - Deep Navy
  '#27AE60', // GES 111 - Forest Green
  '#8E44AD', // PHC 105 - Plum
  '#D35400', // POL 101 - Burnt Orange
  '#2980B9', // PSY 101 - Steel Blue
  '#16A085'  // Extra - Teal
]

export default function Materials() {
  useDocumentTitle('Materials')
  const { courses, loading } = useCourses()
  const [query, setQuery] = useState('')

  if (loading) return <div className="view"><div className="empty">Loading materials…</div></div>

  const q = query.trim().toLowerCase()
  const filtered = (courses || []).filter(c => 
    !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  )

  return (
    <div className="view">
      <div className="materials-hero">
        <h1>Course Materials</h1>
        <p>Notes, textbooks, and past questions for LLB 1.</p>
        <div className="search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input 
            type="text" 
            placeholder="Search courses…" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No courses match "{query}".</div>
      ) : (
        <div className="material-grid">
          {filtered.map((course, i) => {
            const color = COLORS[i % COLORS.length]
            
            // Count the materials by type
            const counts = course.resources?.reduce((acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1
              return acc
            }, {}) || {}

            return (
              <div key={course.slug} className="material-card">
                <div className="material-cover" style={{ background: color }}>
                  <span className="material-code">{course.code}</span>
                  <h2 className="material-title">{course.title}</h2>
                </div>
                <div className="material-body">
                  <div className="material-lecturer">{course.lecturer || 'Faculty of Law'}</div>
                  
                  <div className="material-tags">
                    <span className="mtag">{course.units} Units</span>
                    {Object.entries(counts).map(([type, count]) => (
                      <span key={type} className="mtag mtag-soft">
                        {count} {type}{count > 1 ? 's' : ''}
                      </span>
                    ))}
                    {Object.keys(counts).length === 0 && (
                      <span className="mtag mtag-soft" style={{ opacity: 0.5 }}>No files yet</span>
                    )}
                  </div>

                  <div className="material-actions">
                    <Link to={`/materials/${course.slug}`} className="btn-card-action">
                      View Materials
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
