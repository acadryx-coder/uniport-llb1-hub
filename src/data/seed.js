import mdCaseBrief from './content/case-brief-dvs.md?raw'
import mdLegalReasoning from './content/legal-reasoning.md?raw'
import mdInterpretationAct from './content/interpretation-act.md?raw'
import mdPastQuestions from './content/law-101-pastq.md?raw'
import { daysAgo, daysFromNow } from '../lib/storage.js'

export const courses = [
  {
    code: 'LAW 101', slug: 'law-101', title: 'Legal Methods', units: 4, lecturer: 'Dr. A. Okonkwo',
    resources: [
      { 
        id: 'law101-case-brief-dvs', 
        slug: 'case-brief-dvs', 
        type: 'Note', 
        name: 'Case Brief: Donoghue v Stevenson', 
        size: '8 KB', 
        date: daysAgo(2), 
        md: mdCaseBrief, 
        isPublic: true,
        quiz: {
          title: 'Donoghue v Stevenson Quiz',
          description: 'Test your understanding of the facts, issue, and ratio of this foundational negligence case.',
          questions: [
            { q: 'What did May Donoghue find in her ginger beer bottle?', options: ['A dead rat', 'A decomposing snail', 'A piece of glass', 'Nothing'], answer: 1 },
            { q: 'What was the core legal issue in the case?', options: ['Whether a contract existed', 'Whether the café was liable', 'Whether a manufacturer owes a duty of care to the ultimate consumer', 'Whether the snail was dangerous'], answer: 2 },
            { q: 'Which judge articulated the "neighbour principle"?', options: ['Lord Atkin', 'Lord Macmillan', 'Lord Thankerton', 'Lord Buckmaster'], answer: 0 }
          ]
        }
      },
      { 
        id: 'law101-legal-reasoning', 
        slug: 'legal-reasoning', 
        type: 'Note', 
        name: 'Introduction to Legal Reasoning & Case Analysis', 
        size: '1.2 MB', 
        date: daysAgo(4), 
        md: mdLegalReasoning,
        quiz: {
          title: 'Legal Reasoning Quiz',
          description: 'Check your grasp of the IRAC method and case analysis.',
          questions: [
            { q: 'What does IRAC stand for?', options: ['Issue, Rule, Application, Conclusion', 'Intent, Reason, Action, Crime', 'Inquiry, Resolution, Argument, Case', 'Issue, Reason, Answer, Court'], answer: 0 },
            { q: 'In the Rule step, you should cite the law precisely, not vaguely.', options: ['True', 'False'], answer: 0 },
            { q: 'Where do you apply the rule to the specific facts?', options: ['Issue', 'Rule', 'Application', 'Conclusion'], answer: 2 }
          ]
        }
      },
      { id: 'law101-case-brief-template', slug: 'case-brief-template', type: 'Note', name: 'Case Brief Template & Sample Brief', size: '340 KB', date: daysAgo(6) },
      { id: 'law101-pastq', slug: 'past-questions', type: 'Past Q', name: 'LAW 101 — First Semester Past Questions', size: '340 KB', date: daysAgo(17), md: mdPastQuestions },
      { id: 'law101-freeman-textbook', slug: 'freeman-farer', type: 'Textbook', name: 'Freeman & Farer, Introduction to Legal Method', size: '8.4 MB', date: daysAgo(25) },
      { id: 'law101-interpretation-act', slug: 'interpretation-act', type: 'Statute', name: 'Interpretation Act (Cap I23 LFN 2004)', size: '420 KB', date: daysAgo(60), md: mdInterpretationAct, isPublic: true }
    ]
  },
  {
    code: 'GST 101', slug: 'gst-101', title: 'Communication in English', units: 2, lecturer: 'Mrs. F. Okafor',
    resources: [
      { id: 'gst101-writing', slug: 'academic-writing', type: 'Note', name: 'Academic Writing & Referencing Guide', size: '740 KB', date: daysAgo(8) },
      { id: 'gst101-pastq', slug: 'past-questions', type: 'Past Q', name: 'GST 101 — CA Revision Questions', size: '210 KB', date: daysAgo(12) },
      { id: 'gst101-para', slug: 'paragraph-structure', type: 'Handout', name: 'Paragraph Structure — Worked Examples', size: '180 KB', date: daysAgo(15) }
    ]
  },
  {
    code: 'GST 103', slug: 'gst-103', title: 'Logic & Philosophy', units: 2, lecturer: 'Dr. E. Nwosu',
    resources: [
      { id: 'gst103-logic', slug: 'propositional-logic', type: 'Note', name: 'Propositional Logic — Full Outline', size: '1.1 MB', date: daysAgo(3) },
      { id: 'gst103-fallacy', slug: 'fallacies', type: 'Note', name: 'Fallacies Cheat Sheet', size: '280 KB', date: daysAgo(5) },
      { id: 'gst103-truth', slug: 'truth-tables', type: 'Handout', name: 'Truth Tables — Practice Set', size: '160 KB', date: daysAgo(10) }
    ]
  },
  {
    code: 'GST 105', slug: 'gst-105', title: 'Nigerian Peoples & Culture', units: 2, lecturer: 'Dr. T. Agbai',
    resources: [
      { id: 'gst105-ethnic', slug: 'ethnic-groups', type: 'Note', name: 'Ethnic Groups & Cultural Practices — Summary', size: '960 KB', date: daysAgo(20) },
      { id: 'gst105-readings', slug: 'selected-readings', type: 'Textbook', name: 'Selected Readings in Nigerian Cultures', size: '6.2 MB', date: daysAgo(35) }
    ]
  },
  {
    code: 'GST 107', slug: 'gst-107', title: 'History & Philosophy of Science', units: 2, lecturer: 'Dr. S. Etim',
    resources: [
      { id: 'gst107-method', slug: 'scientific-method', type: 'Note', name: 'Scientific Method & Paradigm Shifts', size: '880 KB', date: daysAgo(7) },
      { id: 'gst107-pastq', slug: 'past-questions', type: 'Past Q', name: 'GST 107 — First Semester Past Questions', size: '260 KB', date: daysAgo(22) }
    ]
  }
]

export const timetable = [
  { day: 1, start: '08:00', end: '10:00', code: 'LAW 101', title: 'Legal Methods', venue: 'LT 1, Faculty of Law' },
  { day: 2, start: '10:00', end: '12:00', code: 'GST 101', title: 'Communication in English', venue: 'ETF Auditorium' },
  { day: 3, start: '08:00', end: '10:00', code: 'LAW 101', title: 'Legal Methods (Tutorial)', venue: 'LT 2, Faculty of Law' },
  { day: 4, start: '12:00', end: '14:00', code: 'GST 103', title: 'Logic & Philosophy', venue: 'Social Sciences Block B' },
  { day: 5, start: '09:00', end: '11:00', code: 'GST 105', title: 'Nigerian Peoples & Culture', venue: 'ETF Auditorium' },
  { day: 5, start: '11:00', end: '13:00', code: 'GST 107', title: 'History & Philosophy of Science', venue: 'LT 1, Faculty of Law' }
]

export const defaultTasks = [
  { id: 'task-1', title: 'Submit Donoghue v Stevenson case brief', course: 'LAW 101', due: daysFromNow(3), completed: false },
  { id: 'task-2', title: 'GST 101 essay submission', course: 'GST 101', due: daysFromNow(5), completed: false },
  { id: 'task-3', title: 'GST 103 CA test', course: 'GST 103', due: daysFromNow(12), completed: false }
]

export const notices = [
  { slug: 'gst-103-venue-change', tag: 'academic', pinned: true, date: daysAgo(2), title: 'GST 103 venue change', body: 'From next week, Logic & Philosophy lectures move from Social Sciences Block B to the Faculty Moot Court. Same day, same time.' },
  { slug: 'moot-court-introductory-session', tag: 'event', pinned: false, date: daysAgo(4), title: 'Moot court introductory session', body: 'All 100-level students are invited to the Faculty Auditorium for the moot court introduction. Attendance will be recorded.' },
  { slug: 'notes-now-on-the-hub', tag: 'general', pinned: false, date: daysAgo(6), title: 'Notes now on the hub', body: 'First semester materials for LAW 101 and GST courses are being uploaded under the Materials tab. Check back weekly.' }
]

export const polls = [
  {
    slug: 'study-group-location',
    question: 'Where should we hold the first study group?',
    options: [
      { id: 'moot-court', label: 'Faculty Moot Court', votes: 14 },
      { id: 'main-library', label: 'Main Library, Level 2', votes: 21 },
      { id: 'lt1-after', label: 'LT 1 after lectures', votes: 9 }
    ]
  }
]

export const contacts = [
  { name: 'Simeon', role: 'Acting Course Rep, LLB 1', action: 'Message' },
  { name: 'To be confirmed', role: 'Assistant Course Rep', action: 'Message' },
  { name: 'To be confirmed', role: 'Faculty Officer', action: 'Call' },
  { name: 'To be confirmed', role: 'Level Adviser', action: 'Call' }
]

export const links = [
  { label: 'LLB 1 WhatsApp group', detail: 'Announcements and class discussion' },
  { label: 'Faculty of Law portal', detail: 'Results, registration and fees' },
  { label: 'UNIPORT e-Library', detail: 'Journals, statutes and case law' }
]

export const TYPES = [
  { key: 'all', label: 'All' }, { key: 'Note', label: 'Notes' },
  { key: 'Textbook', label: 'Textbooks' }, { key: 'Handout', label: 'Handouts' },
  { key: 'Statute', label: 'Statutes' }, { key: 'Past Q', label: 'Past Qs' }
]

export const TYPE_BADGE = { 'Note': 'note', 'Textbook': 'textbook', 'Handout': 'handout', 'Statute': 'statute', 'Past Q': 'pastq' }

export function findCourse(slug) { return courses.find((c) => c.slug === slug) }
export function findResource(courseSlug, resourceSlug) {
  const c = findCourse(courseSlug)
  if (!c) return null
  const r = c.resources.find((res) => res.slug === resourceSlug)
  if (!r) return null
  return { course: c, resource: r }
}
export function findNotice(slug) { return notices.find((n) => n.slug === slug) }
export function findPoll(slug) { return polls.find((p) => p.slug === slug) }
export function getNextClass() {
  const now = new Date()
  const today = now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (let off = 0; off < 8; off++) {
    const day = (today + off) % 7
    const list = timetable
      .filter((e) => e.day === day)
      .sort((a, b) => {
        const am = a.start.split(':').reduce((h, m, i) => i === 0 ? +h * 60 : h + +m, 0)
        const bm = b.start.split(':').reduce((h, m, i) => i === 0 ? +h * 60 : h + +m, 0)
        return am - bm
      })
    for (const ev of list) {
      const evMin = ev.start.split(':').map(Number).reduce((h, m, i) => i === 0 ? h * 60 : h + m, 0)
      if (off === 0 && evMin <= nowMin) continue
      return { event: ev, offset: off, mins: off === 0 ? evMin - nowMin : null }
    }
  }
  return null
}
