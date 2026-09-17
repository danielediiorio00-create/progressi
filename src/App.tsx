import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/Dashboard'
import { SettingsPage } from './pages/Settings'
import { PlaceholderPage } from './pages/Placeholder'
import { BodyPage } from './pages/Body'
import { RunningPage } from './pages/Running'
import { HeartRatePage } from './pages/HeartRate'
import { GymPage } from './pages/Gym'
import { ExercisesPage } from './pages/Exercises'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/corpo" element={<BodyPage />} />
        <Route path="/corsa" element={<RunningPage />} />
        <Route path="/corsa/frequenza-cardiaca" element={<HeartRatePage />} />
        <Route path="/palestra" element={<GymPage />} />
        <Route path="/palestra/esercizi" element={<ExercisesPage />} />
        <Route
          path="/report"
          element={<PlaceholderPage title="Report" phase={6} text="Riepilogo in Markdown da incollare nella chat con il coach." />}
        />
        <Route path="/impostazioni" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
