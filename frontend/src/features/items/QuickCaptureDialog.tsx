import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateItem, useSpaces } from "@/lib/queries"
import type { Space } from "@/lib/api"

const TYPES = ["task", "note", "link", "opportunity", "event"] as const

/** Best guess at the "dump it here" space. */
function pickInbox(spaces: Space[]): Space | undefined {
  return (
    spaces.find((s) => s.name.toLowerCase() === "inbox") ??
    spaces.find((s) => s.is_pinned) ??
    spaces[0]
  )
}

interface QuickCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSpaceId?: number
}

export function QuickCaptureDialog({
  open,
  onOpenChange,
  defaultSpaceId,
}: QuickCaptureDialogProps) {
  const { data: spaces } = useSpaces()
  const create = useCreateItem()

  const [title, setTitle] = useState("")
  const [type, setType] = useState<string>("task")
  const [spaceId, setSpaceId] = useState<string>("")

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTitle("")
    setType("task")
    const initial = defaultSpaceId ?? pickInbox(spaces ?? [])?.id
    setSpaceId(initial != null ? String(initial) : "")
  }, [open, defaultSpaceId, spaces])

  const canSubmit = title.trim().length > 0 && spaceId !== "" && !create.isPending

  const submit = () => {
    if (!canSubmit) return
    create.mutate(
      {
        space_id: Number(spaceId),
        type,
        title: title.trim(),
        priority: 0,
        position: 0,
        is_pinned: false,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick capture</DialogTitle>
          <DialogDescription>
            Dump it now, organise it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qc-title">Title</Label>
            <Input
              id="qc-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="What's on your mind?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Space</Label>
              <Select value={spaceId} onValueChange={setSpaceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Space" />
                </SelectTrigger>
                <SelectContent>
                  {(spaces ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {(s.icon ?? "📁") + " " + s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
