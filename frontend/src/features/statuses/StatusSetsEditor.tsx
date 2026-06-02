import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useAllStatuses,
  useCreateStatus,
  useCreateStatusSet,
  useSpaces,
  useStatusSets,
} from "@/lib/queries"
import { StatusSetCard } from "./StatusSetCard"
import { FrontPageSettings } from "@/features/settings/FrontPageSettings"
import { ReminderSettings } from "@/features/settings/ReminderSettings"
import type { Status } from "@/lib/api"

/** Settings page: create and edit custom status sets (CLAUDE.md §7 editor). */
export function StatusSetsEditor() {
  const { data: sets } = useStatusSets()
  const { data: statuses } = useAllStatuses()
  const { data: spaces } = useSpaces()
  const createSet = useCreateStatusSet()
  const createStatus = useCreateStatus()

  const bySet = useMemo(() => {
    const m = new Map<number, Status[]>()
    for (const s of statuses ?? []) {
      const arr = m.get(s.status_set_id)
      if (arr) arr.push(s)
      else m.set(s.status_set_id, [s])
    }
    for (const arr of m.values()) arr.sort((a, b) => a.position - b.position)
    return m
  }, [statuses])

  // A new set starts with two sensible states so it's usable immediately.
  const newSet = async () => {
    const set = await createSet.mutateAsync({ name: "New set", is_default: false })
    await createStatus.mutateAsync({
      setId: set.id,
      body: { label: "To do", color: "#6366f1", behavior: "active", position: 0 },
    })
    await createStatus.mutateAsync({
      setId: set.id,
      body: { label: "Done", color: "#22c55e", behavior: "done", position: 1 },
    })
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <FrontPageSettings />

      <ReminderSettings />

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Status sets
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              Design your own checkboxes. Each state has a label and colour you
              choose; its <em>behaviour</em> tells the app what it means —{" "}
              <span className="text-foreground">Active</span> stays on your
              lists, <span className="text-foreground">Done</span> /{" "}
              <span className="text-foreground">Dismissed</span> fold into
              Completed.
            </p>
          </div>
          <Button onClick={newSet} className="shrink-0 gap-1.5">
            <Plus className="size-4" />
            New set
          </Button>
        </div>

        <div className="space-y-4">
          {(sets ?? []).map((set) => (
            <StatusSetCard
              key={set.id}
              set={set}
              statuses={bySet.get(set.id) ?? []}
              spaces={spaces ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
