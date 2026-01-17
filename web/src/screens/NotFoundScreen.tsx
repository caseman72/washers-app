import { useNavigate } from 'react-router-dom'

const styles = `
  .not-found-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 1rem;
  }

  .not-found-code {
    font-size: 6rem;
    font-weight: bold;
    color: #d35400;
    margin: 0;
  }

  .not-found-message {
    font-size: 1.5rem;
    color: #888;
    margin: 1rem 0 2rem;
  }

  .home-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .home-btn:hover {
    background: #e55d00;
  }
`

export function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <div className="not-found-screen">
      <h1 className="not-found-code">404</h1>
      <p className="not-found-message">Page not found</p>
      <button className="home-btn" onClick={() => navigate('/')}>
        Back to Home
      </button>
      <style>{styles}</style>
    </div>
  )
}
