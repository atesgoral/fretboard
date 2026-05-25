import { useCallback, useEffect, useMemo, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === 'system' || value === 'light' || value === 'dark'
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialPreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  return isThemePreference(stored) ? stored : 'system'
}

const resolveTheme = (preference: ThemePreference): 'light' | 'dark' => {
  if (preference === 'light' || preference === 'dark') {
    return preference
  }

  return getSystemTheme()
}

export const useThemePreference = () => {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference)

  const applyTheme = useCallback((nextPreference: ThemePreference) => {
    const root = document.documentElement
    const theme = resolveTheme(nextPreference)

    root.classList.toggle('dark', theme === 'dark')
    root.dataset.theme = theme
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, preference)
    applyTheme(preference)

    if (preference !== 'system' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [applyTheme, preference])

  const cyclePreference = useCallback(() => {
    setPreference((current) => {
      if (current === 'system') {
        return 'light'
      }

      if (current === 'light') {
        return 'dark'
      }

      return 'system'
    })
  }, [])

  return useMemo(
    () => ({
      preference,
      setPreference,
      cyclePreference,
    }),
    [cyclePreference, preference],
  )
}
