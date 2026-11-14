# uniport-llb1-hub

Course hub for LLB 1, Faculty of Law, University of Port Harcourt.

## Stack
- React 18 + Vite
- React Router 6 (BrowserRouter — every course, resource, notice, poll gets a shareable URL)
- LegalMD — constrained markdown dialect for legal documents, parsed at render time

## Routes
- `/` — dashboard
- `/timetable` — full lecture schedule
- `/materials` — course list
- `/materials/:courseSlug` — resources for one course
- `/materials/:courseSlug/:resourceSlug` — in-app reader
- `/notices` — notice board
- `/notices/:noticeSlug` — single notice
- `/vote` — polls list
- `/vote/:pollSlug` — single poll
- `/tools` — CGPA calculator + deadline tracker
- `/contacts` — class contacts and links

## Run
```

npm install
npm run dev

```
