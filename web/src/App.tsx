import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { MirrorScreen } from './screens/MirrorScreen'
import { KeepScoreScreen } from './screens/KeepScoreScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { TournamentScreen } from './screens/TournamentScreen'
import { TournamentSetupScreen } from './screens/TournamentSetupScreen'
import { TournamentListScreen } from './screens/TournamentListScreen'
import { BracketScreen } from './screens/BracketScreen'

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
