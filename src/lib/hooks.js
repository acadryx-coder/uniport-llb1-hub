import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('courses').select('*, resources(type)').order('code').then(({ data }) => {
      if (data) setCourses(data)
      setLoading(false)
    })
  }, [])
  return { courses, loading }
}

export function useTimetable() {
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  
  const fetch = () => {
    supabase.from('timetable').select('*').order('day', { ascending: true }).order('start_time', { ascending: true }).then(({ data }) => {
      if (data) setTimetable(data)
      setLoading(false)
    })
  }

  useEffect(() => { fetch() }, [])
  return { timetable, loading, refetch: fetch }
}

export function useSettings() {
  const [settings, setSettings] = useState({ lectures_active: true, resumption_date: null, notice_text: null })
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setSettings(data)
      setLoading(false)
    })
  }

  const update = async (updates) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings) // Optimistic UI update
    await supabase.from('settings').update(updates).eq('id', 1)
  }

  useEffect(() => { fetch() }, [])
  return { settings, loading, update }
}

export function useNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('notices').select('*').order('pinned', { ascending: false }).order('date', { ascending: false }).then(({ data }) => {
      if (data) setNotices(data)
      setLoading(false)
    })
  }, [])
  return { notices, loading }
}

export function usePolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('polls').select('*, poll_options(*)').then(({ data }) => {
      if (data) setPolls(data)
      setLoading(false)
    })
  }, [])
  return { polls, loading }
}

// Helper that respects the active status of classes
export function getNextClass(timetable, settings) {
  if (!timetable || !timetable.length) return null
  if (settings && !settings.lectures_active) return null // Return nothing if suspended

  const now = new Date()
  const today = now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = (t) => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m) }

  for (let off = 0; off < 8; off++) {
    const day = (today + off) % 7
    const list = timetable.filter((e) => e.day === day && e.active)
    for (const ev of list) {
      const evMin = toMin(ev.start_time)
      if (off === 0 && evMin <= nowMin) continue
      return { event: ev, offset: off, mins: off === 0 ? evMin - nowMin : null }
    }
  }
  return null
}


export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tasks').select('*').order('due', { ascending: true }).then(({ data }) => {
      if (data) setTasks(data)
      setLoading(false)
    })
  }, [])

  return { tasks, loading }
}
