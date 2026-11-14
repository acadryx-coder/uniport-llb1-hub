import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Timetable from './pages/Timetable.jsx'
import Materials from './pages/Materials.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import ResourceReader from './pages/ResourceReader.jsx'
import Notices from './pages/Notices.jsx'
import NoticeDetail from './pages/NoticeDetail.jsx'
import Polls from './pages/Polls.jsx'
import PollDetail from './pages/PollDetail.jsx'
import Tools from './pages/Tools.jsx'
import CGPACalculator from './pages/CGPACalculator.jsx'
import MootTimer from './pages/MootTimer.jsx'
import Contacts from './pages/Contacts.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Reader is public */}
      <Route path="/materials/:courseSlug/:resourceSlug" element={<ResourceReader />} />

      {/* All other routes are protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/timetable" element={<Timetable />} />
          
          <Route path="/materials" element={<Materials />} />
          <Route path="/materials/:courseSlug" element={<CourseDetail />} />
          
          <Route path="/notices" element={<Notices />} />
          <Route path="/notices/:noticeSlug" element={<NoticeDetail />} />
          
          <Route path="/vote" element={<Polls />} />
          <Route path="/vote/:pollSlug" element={<PollDetail />} />
          
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/cgpa" element={<CGPACalculator />} />
          <Route path="/tools/timer" element={<MootTimer />} />
          
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
