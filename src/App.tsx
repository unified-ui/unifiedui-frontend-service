import { useIsAuthenticated } from '@azure/msal-react'
import { LoginButton } from './components/LoginButton'
import { ProfileCard } from './components/ProfileCard'
import './App.css'

function App() {
  const isAuthenticated = useIsAuthenticated()

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <LoginButton />
      ) : (
        <ProfileCard />
      )}
    </div>
  )
}

export default App
