import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ModalProvider } from './contexts/ModalContext'
import { HomeScreen } from './screens/HomeScreen'
import { MirrorScreen } from './screens/MirrorScreen'
import { KeepScoreScreen } from './screens/KeepScoreScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { TournamentScreen } from './screens/TournamentScreen'
import { TournamentSetupScreen } from './screens/TournamentSetupScreen'
import { TournamentListScreen } from './screens/TournamentListScreen'
import { BracketScreen } from './screens/BracketScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'

function App() {
  return (
    <BrowserRouter>
      <ModalProvider>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/mirror" element={<MirrorScreen />} />
        <Route path="/keep-score" element={<KeepScoreScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/players" element={<PlayersScreen />} />
        <Route path="/tournament" element={<TournamentScreen />} />
        <Route path="/tournament/new" element={<TournamentSetupScreen />} />
        <Route path="/tournament/list" element={<TournamentListScreen />} />
        <Route path="/tournament/:id" element={<BracketScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      </ModalProvider>
    </BrowserRouter>
  )
}

export default App
