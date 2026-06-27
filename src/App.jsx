import { useState } from 'react'
import NavBar from './components/NavBar'
import Statistiken from './views/Statistiken'
import Runde from './views/Runde'
import Verlauf from './views/Verlauf'
import Kurse from './views/Kurse'
import './styles/global.css'

function renderView(tab) {
  switch (tab) {
    case 'stats':   return <Statistiken />
    case 'round':   return <Runde />
    case 'history': return <Verlauf />
    case 'courses': return <Kurse />
    default:        return <Statistiken />
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('stats')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{
        background: 'var(--dark2)',
        padding: '12px 16px 10px',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 3,
          color: 'var(--gold)',
        }}>
          GOLF ANALYSE
        </span>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {renderView(activeTab)}
      </main>

      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
