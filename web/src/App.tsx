import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { MirrorScreen } from './screens/MirrorScreen'
import { KeepScoreScreen } from './screens/KeepScoreScreen'
import { SettingsScreen } from './screens/SettingsScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/mirror" element={<MirrorScreen />} />
        <Route path="/keep-score" element={<KeepScoreScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
