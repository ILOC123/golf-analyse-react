import styles from './NavBar.module.css'

const tabs = [
  {
    id: 'stats',
    label: 'Statistiken',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="14" width="5" height="8" rx="1.5" fill="#C9A84C" />
        <rect x="9.5" y="9" width="5" height="13" rx="1.5" fill="#27AE60" />
        <rect x="17" y="4" width="5" height="18" rx="1.5" fill="#006B54" />
      </svg>
    ),
  },
  {
    id: 'round',
    label: 'Runde',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="20" rx="9" ry="3.5" fill="#27AE60" />
        <ellipse cx="12" cy="20" rx="2" ry="0.9" fill="#0A3E28" />
        <line x1="12" y1="2.5" x2="12" y2="20" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 2.5L21 6.5L12 10.5Z" fill="#C9A84C" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Verlauf',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#006B54" fillOpacity="0.1" stroke="#006B54" strokeWidth="1.5" />
        <line x1="7" y1="9" x2="17" y2="9" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="13" x2="17" y2="13" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="17" x2="14" y2="17" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'courses',
    label: 'Kurse',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="2.5" fill="#C9A84C" fillOpacity="0.12" stroke="#C9A84C" strokeWidth="1.5" />
        <path d="M6 18 Q7 12 11 9 Q15 6 18 8" stroke="#27AE60" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="18" cy="8" r="2.5" fill="#006B54" />
        <circle cx="6" cy="18" r="1.5" fill="#C9A84C" />
      </svg>
    ),
  },
]

export default function NavBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.btn} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
