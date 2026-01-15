import { useNavigate } from 'react-router-dom'
import { Scoreboard } from '../components/Scoreboard'

const styles = `
  .keep-score-screen {
    position: relative;
    min-height: 100vh;
  }

  .back-btn-overlay {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.6);
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    z-index: 50;
    backdrop-filter: blur(4px);
  }

  .back-btn-overlay:hover {
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }
`

export function KeepScoreScreen() {
  const navigate = useNavigate()

  return (
    <div className="keep-score-screen">
      <Scoreboard />
      <button
        className="back-btn-overlay"
        onClick={() => navigate('/')}
      >
        Back to Menu
      </button>
      <style>{styles}</style>
    </div>
  )
}
