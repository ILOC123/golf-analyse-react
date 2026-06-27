import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const set = (newValue) => {
    const toStore = typeof newValue === 'function' ? newValue(value) : newValue
    setValue(toStore)
    try {
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch {
      // localStorage voll oder gesperrt
    }
  }

  return [value, set]
}
