import { Link } from 'react-router-dom'
import { useLocalStorage, useDocumentTitle } from '../lib/storage.js'

const GRADES = ['A', 'B', 'C', 'D', 'E', 'F']
const POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

export default function CGPACalculator() {
  useDocumentTitle('CGPA Calculator')

  const [cgpa, setCgpa] = useLocalStorage('llb1.cgpa', [
    { id: 1, code: 'LAW 101', units: 4, grade: 'A' },
    { id: 2, code: 'GES 111', units: 2, grade: 'A' },
    { id: 3, code: 'PHC 105', units: 2, grade: 'A' },
    { id: 4, code: 'POL 101', units: 2, grade: 'A' },
    { id: 5, code: 'PSY 101', units: 2, grade: 'A' }
  ])

  const nextCgpaId = cgpa.reduce((m, r) => Math.max(m, r.id), 0) + 1

  let totalUnits = 0
  let totalPoints = 0
  cgpa.forEach((r) => {
    const u = Number(r.units) || 0
    totalUnits += u
    totalPoints += u * (POINTS[r.grade] || 0)
  })
  const gpa = totalUnits ? totalPoints / totalUnits : 0
  let classification = '—'
  if (totalUnits) {
    if (gpa >= 4.5) classification = 'First Class'
    else if (gpa >= 3.5) classification = 'Second Class Upper'
    else if (gpa >= 2.4) classification = 'Second Class Lower'
    else if (gpa >= 1.5) classification = 'Third Class'
    else if (gpa >= 1.0) classification = 'Pass'
    else classification = 'Fail'
  }

  const updateCgpa = (id, field, value) => {
    setCgpa((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: field === 'units' ? Math.max(0, Math.min(6, Number(value) || 0)) : value } : r)))
  }
  const addCgpa = () => setCgpa((rows) => [...rows, { id: nextCgpaId, code: 'NEW COURSE', units: 2, grade: 'A' }])
  const delCgpa = (id) => setCgpa((rows) => rows.filter((r) => r.id !== id))

  return (
    <div className="view">
      <Link to="/tools" className="back-btn">← All tools</Link>
      
      <h3 className="section-title" style={{ marginTop: 4 }}>CGPA calculator</h3>
      <div className="card">
        <div className="mute-2" style={{ marginBottom: 10 }}>5-point scale · saved automatically</div>
        <table className="tbl">
          <thead>
            <tr><th>Course</th><th>Units</th><th>Grade</th><th></th></tr>
          </thead>
          <tbody>
            {cgpa.map((r) => (
              <tr key={r.id}>
                <td><input className="cell" value={r.code} onChange={(e) => updateCgpa(r.id, 'code', e.target.value)} aria-label="Course code" /></td>
                <td><input className="cell" type="number" min="1" max="6" value={r.units} onChange={(e) => updateCgpa(r.id, 'units', e.target.value)} aria-label="Units" /></td>
                <td>
                  <select className="cell" value={r.grade} onChange={(e) => updateCgpa(r.id, 'grade', e.target.value)} aria-label="Grade">
                    {GRADES.map((g) => <option key={g} value={g}>{g} ({POINTS[g]})</option>)}
                  </select>
                </td>
                <td><button className="del" onClick={() => delCgpa(r.id)} aria-label="Remove course">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn ghost sm" onClick={addCgpa}>+ Add course</button>
        <div className="gpa-out">
          <div>
            <div className="gpa-num">{gpa.toFixed(2)}</div>
            <div className="gpa-lab">Semester GPA</div>
          </div>
          <div className="gpa-class">
            <span>{classification}</span>
            <small>{totalUnits} unit{totalUnits === 1 ? '' : 's'} registered</small>
          </div>
        </div>
      </div>
    </div>
  )
}
