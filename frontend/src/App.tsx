import { Navigate, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"
import { DesktopLayout } from "@/layouts/DesktopLayout"
import { MobileLayout } from "@/layouts/MobileLayout"
import { TodayView } from "@/features/today/TodayView"
import { SpaceView } from "@/features/spaces/SpaceView"
import { StatusSetsEditor } from "@/features/statuses/StatusSetsEditor"
import { CalendarPanel } from "@/features/calendar/CalendarPanel"
import { DialogsProvider } from "@/features/items/dialogs"
import { AuthGate } from "@/features/auth/AuthGate"

export default function App() {
  // Same feature components, two layouts (CLAUDE.md §9). Switch at the lg
  // breakpoint — Tailwind's lg is 1024px.
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const Layout = isDesktop ? DesktopLayout : MobileLayout

  return (
    <AuthGate>
      <TooltipProvider delayDuration={200}>
        <DialogsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TodayView />} />
              <Route path="space/:spaceId" element={<SpaceView />} />
              <Route path="calendar" element={<CalendarPanel />} />
              <Route path="settings" element={<StatusSetsEditor />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DialogsProvider>
      </TooltipProvider>
    </AuthGate>
  )
}
