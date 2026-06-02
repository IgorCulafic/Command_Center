import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { ChevronDown, ChevronRight, FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  useAttachments,
  useItems,
  useSpaces,
  useStatusIndex,
} from "@/lib/queries"
import { groupByStatus, type StatusIndex } from "@/lib/status"
import { ItemRow } from "@/features/items/ItemRow"
import { useDialogs } from "@/features/items/dialogs"
import { FilesPanel } from "@/features/files/FilesPanel"
import { cn } from "@/lib/utils"
import type { Item } from "@/lib/api"

/** Per-space view: items grouped into a section per status; completed folded below. */
export function SpaceView() {
  const { spaceId } = useParams()
  const id = Number(spaceId)

  const { data: spaces } = useSpaces()
  const { data: items, isLoading } = useItems({ space_id: id })
  const index = useStatusIndex()
  const { openCapture } = useDialogs()
  const { data: libraryFiles } = useAttachments({ space_id: id })
  const [completedOpen, setCompletedOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const space = useMemo(
    () => (spaces ?? []).find((s) => s.id === id),
    [spaces, id],
  )

  const { activeGroups, closedGroups, noStatus, completedCount } = useMemo(() => {
    const { groups, noStatus } = groupByStatus(index, items ?? [])
    const active = groups.filter((g) => g.status.behavior === "active")
    const closed = groups.filter((g) => g.status.behavior !== "active")
    return {
      activeGroups: active,
      closedGroups: closed,
      noStatus,
      completedCount: closed.reduce((n, g) => n + g.items.length, 0),
    }
  }, [items, index])

  const total = items?.length ?? 0
  const hasActive = activeGroups.length > 0 || noStatus.length > 0

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="text-2xl leading-none">{space?.icon ?? "📁"}</span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {space?.name ?? "Space"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "item" : "items"}
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => openCapture(id)}
        >
          <Plus className="size-4" />
          Add item
        </Button>
      </header>

      {space?.description && <SpaceDescription text={space.description} />}

      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-14 animate-pulse rounded-lg border bg-card"
            />
          ))}
        </ul>
      ) : total === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          This space is empty. Items added here will appear in this list.
        </div>
      ) : (
        <div className="space-y-6">
          {hasActive ? (
            <div className="space-y-6">
              {activeGroups.map((g) => (
                <StatusSection
                  key={g.status.id}
                  label={g.status.label}
                  color={g.status.color}
                  items={g.items}
                  index={index}
                />
              ))}
              {noStatus.length > 0 && (
                <StatusSection label="Other" items={noStatus} index={index} />
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nothing active here. ✨
            </div>
          )}

          {completedCount > 0 && (
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ChevronRight
                  className={cn(
                    "size-4 transition-transform",
                    completedOpen && "rotate-90",
                  )}
                />
                Completed ({completedCount})
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-3">
                {closedGroups.map((g) => (
                  <StatusSection
                    key={g.status.id}
                    label={g.status.label}
                    color={g.status.color}
                    items={g.items}
                    index={index}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronRight
            className={cn(
              "size-4 transition-transform",
              libraryOpen && "rotate-90",
            )}
          />
          <FolderOpen className="size-4" />
          Library{libraryFiles?.length ? ` (${libraryFiles.length})` : ""}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <FilesPanel target={{ space_id: id }} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SpaceDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const isLong = text.length > 140 || text.includes("\n")

  return (
    <div className="rounded-lg border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
      <p className={open || !isLong ? "whitespace-pre-wrap" : "line-clamp-2"}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function StatusSection({
  label,
  color,
  items,
  index,
}: {
  label: string
  color?: string
  items: Item[]
  index: StatusIndex
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {color && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span>{label}</span>
        <span className="text-muted-foreground/60">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} index={index} />
        ))}
      </ul>
    </section>
  )
}
