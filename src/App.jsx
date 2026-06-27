import { useState } from 'react'
import NavBar from './components/NavBar'
import Statistiken from './views/Statistiken'
import Runde from './views/Runde'
import Verlauf from './views/Verlauf'
import Kurse from './views/Kurse'
import { useGolfData } from './hooks/useGolfData'
import './styles/global.css'

function renderView(tab, data) {
  switch (tab) {
    case 'stats':   return <Statistiken data={data} />
    case 'round':   return <Runde data={data} />
    case 'history': return <Verlauf data={data} />
    case 'courses': return <Kurse data={data} />
    default:        return <Statistiken data={data} />
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('stats')
  const data = useGolfData()

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
        {renderView(activeTab, data)}
      </main>

      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
