import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/Dashboard'
import { SettingsPage } from './pages/Settings'
import { PlaceholderPage } from './pages/Placeholder'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/corpo"
          element={<PlaceholderPage title="Corpo" phase={2} text="Peso, circonferenze, media mobile settimanale e rapporto vita/altezza." />}
        />
        <Route
          path="/corsa"
          element={<PlaceholderPage title="Corsa" phase={3} text="Distanza, durata, passo e velocità calcolati, grafici nel tempo." />}
        />
        <Route
          path="/palestra"
          element={<PlaceholderPage title="Palestra" phase={4} text="Sessioni con esercizi, serie, ripetizioni, carico e RIR." />}
        />
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
