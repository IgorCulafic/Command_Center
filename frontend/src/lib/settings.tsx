import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

/**
 * Lightweight client-side preferences (single user — no backend needed).
 * Persisted to localStorage. Controls what reaches the Today front page.
 */
interface Settings {
  /** How many priority cards show on Today. */
  todayTopCount: number
  /** How many upcoming deadlines the rail shows. */
  upcomingCount: number
  /** Space ids excluded from the Today feed + deadline rail. */
  hiddenFromToday: number[]
}

const DEFAULTS: Settings = {
  todayTopCount: 3,
  upcomingCount: 12,
  hiddenFromToday: [],
}

const STORAGE_KEY = "command-center.settings.v1"

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULTS
}

interface SettingsContextValue extends Settings {
  setTodayTopCount: (n: number) => void
  setUpcomingCount: (n: number) => void
  toggleHiddenFromToday: (spaceId: number) => void
  isHiddenFromToday: (spaceId: number) => boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>")
  return ctx
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo
  return Math.max(lo, Math.min(hi, n))
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const value: SettingsContextValue = {
    ...settings,
    setTodayTopCount: (n) =>
      setSettings((s) => ({ ...s, todayTopCount: clamp(n, 1, 12) })),
    setUpcomingCount: (n) =>
      setSettings((s) => ({ ...s, upcomingCount: clamp(n, 1, 50) })),
    toggleHiddenFromToday: (spaceId) =>
      setSettings((s) => ({
        ...s,
        hiddenFromToday: s.hiddenFromToday.includes(spaceId)
          ? s.hiddenFromToday.filter((x) => x !== spaceId)
          : [...s.hiddenFromToday, spaceId],
      })),
    isHiddenFromToday: (spaceId) => settings.hiddenFromToday.includes(spaceId),
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
