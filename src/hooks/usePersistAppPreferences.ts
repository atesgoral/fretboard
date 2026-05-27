import { useEffect } from 'react'
import type { AppState } from '../state/appState'
import { APP_PREFERENCES_STORAGE_KEY, toStoredPreferences } from '../state/appState'

export function usePersistAppPreferences(appState: AppState) {
  useEffect(() => {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(toStoredPreferences(appState)))
  }, [appState])
}

