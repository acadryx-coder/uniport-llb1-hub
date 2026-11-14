import { Link } from 'react-router-dom'
import { useTasks } from '../lib/hooks.js'
import { useLocalStorage, daysBetween, relDate, useDocumentTitle } from '../lib/storage.js'

const TOOL_LINKS = [
  { 
    to: '/tools/cgpa', 
    title: 'CGPA Calculator', 
    desc: 'Calculate your semester GPA on the 5-point scale.',
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>
  },
  { 
    to: '/tools/timer', 
    title: 'Moot Court Timer', 
    desc: 'Precision countdown for oral arguments and rebuttals.',
    icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M10 2h4"></path></svg>
  },
]

export default function Tools() {
  useDocumentTitle('Tools')
  
  const { tasks, loading } = useTasks()
  const [completedTasks, setCompletedTasks] = useLocalStorage('llb1.completed_tasks', [])

  const toggleTask = (id) => {
    if (completedTasks.includes(id)) {
      setCompletedTasks(prev => prev.filter(x => x !== id))
    } else {
      setCompletedTasks(prev => [...prev, id])
    }
  }

  return (
    <div className="view">
      <h3 className="section-title" style={{ marginTop: 4 }}>Student Utilities</h3>
      
      <div className="tools-grid">
        {TOOL_LINKS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <div className="tool-info">
              <h4>{tool.title}</h4>
              <p>{tool.desc}</p>
            </div>
            <div className="tool-arrow">→</div>
          </Link>
        ))}
      </div>

      <h3 className="section-title">Class Deadlines</h3>
      <div className="note" style={{ marginBottom: 12, marginTop: -4 }}>
        Official deadlines posted by the Course Rep. Check them off as you complete them.
      </div>

      {loading ? (
        <div className="empty">Loading deadlines…</div>
      ) : tasks.length === 0 ? (
        <div className="empty">No active deadlines right now.</div>
      ) : (
        tasks.map((t) => {
          const isDone = completedTasks.includes(t.id)
          const diff = daysBetween(t.due)
          const cls = isDone ? 'completed' : diff < 0 ? 'overdue' : diff <= 3 ? 'soon' : ''
          return (
            <div key={t.id} className={`task-row ${cls}`}>
              <button
                className={`task-checkbox ${isDone ? 'checked' : ''}`}
                onClick={() => toggleTask(t.id)}
                aria-label={`Mark ${t.title} as ${isDone ? 'incomplete' : 'complete'}`}
              />
              <div className="task-info">
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  {t.course_code ? `${t.course_code} · ` : ''}Due {relDate(t.due)}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
