import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { EditFirstPage } from '../pages/EditFirstPage'
import { FirstDetailPage } from '../pages/FirstDetailPage'
import { HomePage } from '../pages/HomePage'
import { NewFirstPage } from '../pages/NewFirstPage'
import { RecoveryPage } from '../pages/RecoveryPage'
import { SettingsPage } from '../pages/SettingsPage'
import { YearReviewPage } from '../pages/YearReviewPage'

function NotFoundPage() {
  return (
    <main className="missing-page">
      <p className="eyebrow">404 · MY FIRSTS</p>
      <h1>Page not found</h1>
      <Link to="/">Back to this year</Link>
    </main>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewFirstPage />} />
      <Route path="/first/:id" element={<FirstDetailPage />} />
      <Route path="/first/:id/edit" element={<EditFirstPage />} />
      <Route path="/year/:year" element={<HomePage />} />
      <Route path="/year/:year/review" element={<YearReviewPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export function AppRouter() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
