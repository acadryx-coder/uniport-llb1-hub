import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useLocalStorage, useDocumentTitle } from '../lib/storage.js'

export default function PollDetail() {
  const { pollSlug } = useParams()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  
  const [myVote, setMyVote] = useLocalStorage(`llb1.poll.${pollSlug}.myVote`, null)

  useDocumentTitle(poll ? poll.question : 'Poll')

  const fetchPoll = async () => {
    const { data } = await supabase.from('polls').select('*, poll_options(*)').eq('slug', pollSlug).single()
    if (data) {
      // Sort options by ID so they don't jump around
      data.poll_options.sort((a, b) => a.id.localeCompare(b.id))
      setPoll(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPoll()
  }, [pollSlug])

  if (loading) return <div className="view"><div className="empty">Loading poll…</div></div>
  if (!poll) return <div className="view"><Link to="/vote" className="back-btn">← All polls</Link><div className="empty">Poll not found.</div></div>

  const total = poll.poll_options.reduce((s, o) => s + o.votes, 0)

  const handleVote = async (optionId) => {
    if (myVote || voting) return
    setVoting(true)
    
    // In a real app, you'd use a Supabase RPC function to increment safely.
    // For now, we'll just read the current votes and add 1.
    const option = poll.poll_options.find(o => o.id === optionId)
    const newVotes = option.votes + 1

    const { error } = await supabase.from('poll_options').update({ votes: newVotes }).eq('id', optionId)
    
    if (!error) {
      setMyVote(optionId)
      await fetchPoll() // Refresh the numbers
    } else {
      alert("Failed to vote: " + error.message)
    }
    setVoting(false)
  }

  return (
    <div className="view">
      <Link to="/vote" className="back-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        All polls
      </Link>
      
      <div className="card">
        <h3>{poll.question}</h3>
        <div className="mute-2" style={{ marginBottom: 14 }}>{total} vote{total === 1 ? '' : 's'} so far</div>
        
        {poll.poll_options.map((o) => {
          const pc = total ? Math.round((o.votes / total) * 100) : 0
          const isMine = myVote === o.id
          return (
            <div key={o.id} className="poll-opt">
              <div className="poll-top">
                <b>{o.label}{isMine ? ' ✓' : ''}</b>
                <span>{o.votes} · {pc}%</span>
              </div>
              <div className="bar"><i style={{ width: `${pc}%` }} /></div>
              {!myVote && (
                <button className="btn ghost sm" onClick={() => handleVote(o.id)} disabled={voting}>
                  {voting ? 'Voting…' : 'Vote'}
                </button>
              )}
            </div>
          )
        })}
        
        {myVote && <div className="mute" style={{ marginTop: 10 }}>Thanks — your vote is counted.</div>}
      </div>
    </div>
  )
}
