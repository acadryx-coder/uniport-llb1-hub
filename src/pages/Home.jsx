import { useState } from 'react'
import { Link } from 'react-router-dom'
import { findResource } from '../data/seed.js'
import { useCourses, useTimetable, useNotices, useSettings, useTasks, getNextClass } from '../lib/hooks.js'
import { useAuth } from '../lib/auth.js'
import { useLocalStorage, getLastRead, DAYS, MONTHS, countdown, daysBetween, relDate, fmtDate, useDocumentTitle } from '../lib/storage.js'

const QUICK_LINKS = [
  { to: '/timetable', label: 'Timetable', sub: 'This week', icon: '▦' },
  { to: '/materials', label: 'Materials', sub: 'Notes & past Q', icon: '📖' },
  { to: '/notices', label: 'Notices', sub: 'Board', icon: '🔔' },
  { to: '/vote', label: 'Vote', sub: 'Class polls', icon: '🗳' },
  { to: '/tools', label: 'Tools', sub: 'CGPA & tasks', icon: '∑' },
  { to: '/contacts', label: 'Contacts', sub: 'People & links', icon: '👥' }
]

export default function Home() {
  useDocumentTitle(null)
  const { user } = useAuth()
  const now = new Date()
  const greet = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  // 1. Fetch State
  const { courses } = useCourses()
  const { timetable } = useTimetable()
  const { notices } = useNotices()
  const { settings } = useSettings()
  const { tasks } = useTasks()
  
  // 2. Local Student State
  const [completedTasks, setCompletedTasks] = useLocalStorage('llb1.completed_tasks', [])
  const [readNotices, setReadNotices] = useLocalStorage('llb1.read_notices', [])
  const [justCompleted, setJustCompleted] = useState([])

  // 3. Derive UI State
  const next = getNextClass(timetable, settings)
  const lastRead = getLastRead()
  const lastFound = lastRead ? findResource(lastRead.id) : null

  const readList = Array.isArray(readNotices) ? readNotices : []
  const unreadNotices = (notices || []).filter((n) => !readList.includes(n.slug))
  const topNotice = unreadNotices.find((n) => n.pinned) || unreadNotices[0]

  const toggleTask = (id) => {
    const isDone = completedTasks.includes(id)
    if (!isDone) {
      setJustCompleted(prev => [...prev, id])
      setCompletedTasks(prev => [...prev, id])
    } else {
      setJustCompleted(prev => prev.filter(x => x !== id))
      setCompletedTasks(prev => prev.filter(x => x !== id))
    }
  }

  const dismissNotice = (e, slug) => {
    e.preventDefault(); e.stopPropagation(); setReadNotices([...readList, slug])
  }

  // Tasks State: Pending tasks + tasks just checked off in this session
  const visibleTasks = (tasks || [])
    .filter((t) => !completedTasks.includes(t.id) || justCompleted.includes(t.id))
    .sort((a, b) => a.due.localeCompare(b.due))

  const totalUnits = (courses || []).reduce((s, c) => s + c.units, 0)
  const pendingCount = visibleTasks.filter(t => !completedTasks.includes(t.id)).length

  return (
    <div className="view">
      <div className="hero">
        <div className="date">
          {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}
        </div>
        <h2>{greet}, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}.</h2>
        <p>
          {courses?.length || 0} courses · {totalUnits} units · {pendingCount ? `${pendingCount} task${pendingCount === 1 ? '' : 's'} pending` : 'all caught up'}
        </p>
      </div>

      {/* LECTURES STATE */}
      {settings && !settings.lectures_active ? (
        <div className="card next" style={{ borderColor: 'var(--danger-line)', background: 'var(--danger-soft)' }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>Academic Notice</div>
          <h3 style={{ color: 'var(--danger)' }}>Lectures Suspended</h3>
          <div className="mute">
            {settings.resumption_date ? `Resuming on ${fmtDate(settings.resumption_date)}` : 'Check the timetable for resumption updates.'}
          </div>
          {settings.notice_text && <p style={{ marginTop: 8, fontSize: '0.85rem' }}>{settings.notice_text}</p>}
        </div>
      ) : next ? (
        <div className="card next">
          <div className="eyebrow">Next lecture</div>
          <h3>{next.event.code} — {next.event.title}</h3>
          <div className="mute">
            {next.event.start_time.slice(0,5)}–{next.event.end_time.slice(0,5)} 
            {next.event.venue ? ` · ${next.event.venue}` : ''}
          </div>
          <div className="pill">
            {next.offset === 0 ? `Today · in ${countdown(next.mins)}` : next.offset === 1 ? `Tomorrow · ${next.event.start_time.slice(0,5)}` : `${DAYS[next.event.day]} · ${next.event.start_time.slice(0,5)}`}
          </div>
        </div>
      ) : (
        <div className="card next">
          <div className="eyebrow">Next lecture</div>
          <h3>No classes scheduled</h3>
        </div>
      )}

      {lastRead && lastFound && (
        <>
          <h3 className="section-title">Continue reading</h3>
          <Link to={`/materials/${lastFound.course.slug}/${lastFound.resource.slug}`} className="card continue" style={{ display: 'block' }}>
            <div className="eyebrow">{lastFound.course.code} · {lastFound.resource.type}</div>
            <h3>{lastFound.resource.name}</h3>
            <div className="continue-bar"><i style={{ width: `${lastRead.pct}%` }} /></div>
            <div className="mute-2">{lastRead.pct}% complete</div>
          </Link>
        </>
      )}

      {/* TASKS STATE */}
      {visibleTasks.length > 0 && (
        <>
          <h3 className="section-title">Needs your attention</h3>
          {visibleTasks.slice(0, 3).map((t) => {
            const isDone = completedTasks.includes(t.id)
            const diff = daysBetween(t.due)
            const cls = isDone ? 'completed' : diff < 0 ? 'overdue' : diff <= 3 ? 'soon' : ''
            return (
              <div key={t.id} className={`task-row ${cls}`}>
                <button className={`task-checkbox ${isDone ? 'checked' : ''}`} onClick={() => toggleTask(t.id)} />
                <div className="task-info">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">{t.course_code ? `${t.course_code} · ` : ''}Due {relDate(t.due)}</div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* NOTICES STATE */}
      {topNotice && (
        <>
          <h3 className="section-title">Unread notice</h3>
          <Link to={`/notices/${topNotice.slug}`} className={`notice ${topNotice.tag} ${topNotice.pinned ? 'pinned' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="notice-top">
              <span className={`tg ${topNotice.tag}`}>{topNotice.tag === 'urgent' ? 'Urgent' : topNotice.tag === 'academic' ? 'Academic' : 'Notice'}</span>
              {topNotice.pinned && <span className="tg pinned">Pinned</span>}
              <span className="notice-date">{relDate(topNotice.date)}</span>
              <button className="notice-dismiss" onClick={(e) => dismissNotice(e, topNotice.slug)}>&times;</button>
            </div>
            <h4>{topNotice.title}</h4>
            <p>{topNotice.body}</p>
          </Link>
        </>
      )}

      <h3 className="section-title">Jump to</h3>
      <div className="quick-grid">
        {QUICK_LINKS.map((q) => (
          <Link key={q.to} to={q.to} className="quick-tile">
            <span className="qi">{q.icon}</span>
            <span className="qt">{q.label}</span>
            <span className="qs">{q.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
