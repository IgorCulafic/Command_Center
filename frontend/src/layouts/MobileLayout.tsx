import { useState, type ReactNode } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  FolderTree,
  Home,
  Menu,
  Plus,
  Search,
  User,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/features/spaces/SidebarContent"
import { useDialogs } from "@/features/items/dialogs"
import { formatTodayLong } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Single-column mobile layout: top bar · context body · bottom nav · drawer. */
export function MobileLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { openCapture } = useDialogs()

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="grid size-9 -ml-2 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-col">
          <span className="font-semibold leading-tight">Today</span>
          <span className="truncate text-xs text-muted-foreground">
            {formatTodayLong()}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1 text-muted-foreground">
          <IconButton label="Search">
            <Search className="size-5" />
          </IconButton>
          <IconButton label="Notifications">
            <Bell className="size-5" />
          </IconButton>
          <div className="ml-1 grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            <User className="size-4" />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav: Today · Spaces · + · Deadlines · Profile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 items-stretch justify-around border-t bg-card/95 backdrop-blur">
        <TabLink to="/" icon={<Home className="size-5" />} label="Today" />
        <TabButton
          onClick={() => setDrawerOpen(true)}
          icon={<FolderTree className="size-5" />}
          label="Spaces"
        />
        <div className="flex items-center justify-center px-1">
          <button
            type="button"
            aria-label="Quick capture"
            onClick={() => openCapture()}
            className="grid size-12 -translate-y-3 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Plus className="size-6" />
          </button>
        </div>
        <TabButton
          onClick={() => navigate("/calendar")}
          icon={<CalendarDays className="size-5" />}
          label="Calendar"
        />
        <TabButton
          onClick={() => undefined}
          icon={<User className="size-5" />}
          label="Profile"
        />
      </nav>
    </div>
  )
}

function IconButton({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-9 place-items-center rounded-md hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  )
}

const tabClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
const tabActiveClass = "text-primary"

function TabLink({
  to,
  icon,
  label,
}: {
  to: string
  icon: ReactNode
  label: string
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => cn(tabClass, isActive && tabActiveClass)}
    >
      {icon}
      {label}
    </NavLink>
  )
}

function TabButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button type="button" onClick={onClick} className={tabClass}>
      {icon}
      {label}
    </button>
  )
}
