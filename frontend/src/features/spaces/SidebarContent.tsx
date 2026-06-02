import { useMemo, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Home, Pin, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useItems, useSpaces } from "@/lib/queries"
import { buildSpaceTree } from "@/lib/tree"
import { cn } from "@/lib/utils"
import { useDialogs } from "@/features/items/dialogs"
import { SpacesTree } from "./SpacesTree"

interface SidebarContentProps {
  /** Called after a navigation — used to close the mobile drawer. */
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { data: spaces, isLoading } = useSpaces()
  const { data: items } = useItems()
  const { openCapture, openSpaceCreate } = useDialogs()

  // Item-count badges per space (CLAUDE.md §9). Count every non-deleted item.
  const counts = useMemo(() => {
    const m = new Map<number, number>()
    for (const it of items ?? []) {
      m.set(it.space_id, (m.get(it.space_id) ?? 0) + 1)
    }
    return m
  }, [items])

  const tree = useMemo(() => buildSpaceTree(spaces ?? []), [spaces])
  const pinned = (spaces ?? []).filter((s) => s.is_pinned)

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 pt-1">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          C
        </div>
        <span className="font-semibold tracking-tight">Command Center</span>
      </div>

      <Button
        className="w-full justify-start gap-2"
        size="sm"
        onClick={() => {
          onNavigate?.()
          openCapture()
        }}
      >
        <Plus className="size-4" />
        Quick Add
      </Button>

      <ScrollArea className="-mx-1 min-h-0 flex-1 px-1">
        <nav className="space-y-0.5">
          <SideLink
            to="/"
            end
            icon={<Home className="size-4" />}
            label="Today"
            onNavigate={onNavigate}
          />
        </nav>

        {pinned.length > 0 && (
          <Section title="Pinned" icon={<Pin className="size-3" />}>
            <ul className="space-y-0.5">
              {pinned.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={`/space/${s.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(rowClass, isActive && rowActiveClass)
                    }
                  >
                    <span className="text-base leading-none">{s.icon ?? "📌"}</span>
                    <span className="flex-1 truncate">{s.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section
          title="Spaces"
          action={
            <button
              type="button"
              aria-label="New space"
              onClick={() => openSpaceCreate()}
              className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          }
        >
          {isLoading ? (
            <SkeletonRows />
          ) : (
            <SpacesTree nodes={tree} counts={counts} onNavigate={onNavigate} />
          )}
        </Section>
      </ScrollArea>

      <Separator />

      <SideLink
        to="/settings"
        icon={<Settings className="size-4" />}
        label="Settings"
        onNavigate={onNavigate}
      />
    </div>
  )
}

const rowClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
const rowActiveClass =
  "bg-sidebar-accent font-medium text-sidebar-accent-foreground"

function SideLink({
  to,
  end,
  icon,
  label,
  onNavigate,
}: {
  to: string
  end?: boolean
  icon: ReactNode
  label: string
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => cn(rowClass, isActive && rowActiveClass)}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </NavLink>
  )
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 px-2 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-1 px-2">
      {[60, 75, 50].map((w, i) => (
        <div
          key={i}
          className="h-7 animate-pulse rounded-md bg-sidebar-accent/60"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}
