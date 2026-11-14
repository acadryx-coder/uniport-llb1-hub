import { useState } from 'react'
import { useTimetable, useSettings, getNextClass } from '../lib/hooks.js'
import { supabase } from '../lib/supabase.js'
import { DAYS, toMin, fmtDate, useDocumentTitle } from '../lib/storage.js'

export default function Timetable() {
  useDocumentTitle('Timetable')
  const { timetable, loading, refetch } = useTimetable()
  const { settings, update } = useSettings()
  const [isEditing, setIsEditing] = useState(false)

  if (loading) return <div className="view"><div className="empty">Loading timetable…</div></div>

  const today = new Date().getDay()
  const next = getNextClass(timetable, settings)
  const nextKey = next ? `${next.event.day}-${next.event.start_time}-${next.event.code}` : null
  const uniqueDays = [...new Set(timetable.map(t => t.day))].sort()

  const handleToggleGlobal = async () => {
    await update({ lectures_active: !settings.lectures_active })
  }

  const handleDateChange = async (e) => {
    await update({ resumption_date: e.target.value || null })
  }

  const toggleClassActive = async (id, currentStatus) => {
    // Optimistic UI update
    await supabase.from('timetable').update({ active: !currentStatus }).eq('id', id)
    refetch()
  }

  return (
    <div className="view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Lecture timetable</h3>
        <button className={`btn ${isEditing ? 'btn-gold' : 'ghost'} sm`} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Done Editing' : 'Edit Schedule'}
        </button>
      </div>

      {isEditing && (
        <div className="card" style={{ background: 'var(--card-2)', borderColor: 'var(--acc-line)' }}>
          <h4 style={{ margin: '0 0 10px' }}>Global Term Status</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.lectures_active} onChange={handleToggleGlobal} style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>Lectures are currently active</span>
          </label>
          {!settings.lectures_active && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--mute)', marginBottom: 4 }}>Resumption Date</label>
              <input 
                type="date" 
                className="input" 
                value={settings.resumption_date || ''} 
                onChange={handleDateChange} 
                style={{ maxWidth: 200 }}
              />
            </div>
          )}
        </div>
      )}

      {settings && !settings.lectures_active && !isEditing && (
        <div className="card" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger-line)', marginBottom: 20 }}>
          <strong style={{ color: 'var(--danger)' }}>Lectures Suspended.</strong> Resuming {settings.resumption_date ? fmtDate(settings.resumption_date) : 'soon'}.
        </div>
      )}

      {uniqueDays.map((day) => {
        const events = timetable.filter((e) => e.day === day)
        const isToday = day === today

        return (
          <div key={day} className="day">
            <div className={`day-label ${isToday ? 'today' : ''}`}>
              {DAYS[day]}
              {isToday && <span className="chip">Today</span>}
            </div>
            
            {events.map((ev) => {
              const isNext = `${ev.day}-${ev.start_time}-${ev.code}` === nextKey
              const isActive = ev.active
              
              return (
                <div key={ev.id} className={`slot ${isNext && isActive ? 'is-next' : ''}`} style={{ opacity: isActive ? 1 : 0.5 }}>
                  <div className="time">{ev.start_time.slice(0, 5)}–{ev.end_time.slice(0, 5)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="code" style={{ textDecoration: isActive ? 'none' : 'line-through' }}>
                      {ev.code}
                    </div>
                    <div className="title">{ev.title}</div>
                    {ev.venue && <div className="venue">{ev.venue}</div>}
                  </div>
                  
                  {isEditing && (
                    <button 
                      className={`btn sm ${isActive ? 'ghost' : 'btn-gold'}`} 
                      onClick={() => toggleClassActive(ev.id, isActive)}
                    >
                      {isActive ? 'Cancel' : 'Restore'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
      
      <div className="note">Live data from the Faculty of Law 2025/2026 First Semester schedule.</div>
    </div>
  )
}
