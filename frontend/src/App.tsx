import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { ClubsPage } from './pages/ClubsPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { MatchesPage } from './pages/MatchesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayersPage } from './pages/PlayersPage';
import { StandingsPage } from './pages/StandingsPage';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/jogadores" replace />} />
        <Route path="jogadores" element={<PlayersPage />} />
        <Route path="clubes" element={<ClubsPage />} />
        <Route path="clubes/:clubId" element={<ClubDetailPage />} />
        <Route path="partidas" element={<MatchesPage />} />
        <Route path="partidas/:matchId" element={<MatchDetailPage />} />
        <Route path="classificacao" element={<StandingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;