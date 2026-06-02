import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDeleteItem, useSpaces, useUpdateItem } from "@/lib/queries"
import { FilesPanel } from "@/features/files/FilesPanel"
import type { Item } from "@/lib/api"

const TYPES = ["task", "note", "link", "opportunity", "event"] as const

/** ISO datetime → "yyyy-mm-dd" for a <input type="date">. */
function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ""
}

interface ItemEditDialogProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemEditDialog({ item, open, onOpenChange }: ItemEditDialogProps) {
  const { data: spaces } = useSpaces()
  const update = useUpdateItem()
  const del = useDeleteItem()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState("task")
  const [spaceId, setSpaceId] = useState("")
  const [priority, setPriority] = useState("0")
  const [due, setDue] = useState("")

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setBody(item.body ?? "")
    setType(item.type)
    setSpaceId(String(item.space_id))
    setPriority(String(item.priority ?? 0))
    setDue(toDateInput(item.due_at))
  }, [item])

  if (!item) return null

  const save = () => {
    update.mutate(
      {
        id: item.id,
        body: {
          title: title.trim() || item.title,
          body: body.trim() ? body : null,
          type,
          space_id: Number(spaceId),
          priority: Number(priority) || 0,
          due_at: due ? `${due}T00:00:00` : null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const remove = () =>
    del.mutate(item.id, { onSuccess: () => onOpenChange(false) })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ie-title">Title</Label>
            <Input
              id="ie-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ie-body">Notes</Label>
            <Textarea
              id="ie-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Markdown supported…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Space</Label>
              <Select value={spaceId} onValueChange={setSpaceId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
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

            <div className="space-y-1.5">
              <Label htmlFor="ie-priority">Priority</Label>
              <Input
                id="ie-priority"
                type="number"
                min={0}
                max={100}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ie-due">Due date</Label>
              <Input
                id="ie-due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Attachments</Label>
            <FilesPanel target={{ item_id: item.id }} />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={remove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={update.isPending}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
