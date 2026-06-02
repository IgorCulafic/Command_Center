import { createContext, useContext, useState, type ReactNode } from "react"
import { QuickCaptureDialog } from "./QuickCaptureDialog"
import { ItemEditDialog } from "./ItemEditDialog"
import { SpaceDialog } from "@/features/spaces/SpaceDialog"
import type { Item, Space } from "@/lib/api"

interface DialogsContextValue {
  /** Open quick capture, optionally pre-selecting a space. */
  openCapture: (defaultSpaceId?: number) => void
  /** Open the editor for an existing item. */
  openItem: (item: Item) => void
  /** Open the "new space" dialog, optionally under a parent (subspace). */
  openSpaceCreate: (parentId?: number) => void
  /** Open the "edit space" dialog. */
  openSpaceEdit: (space: Space) => void
}

const DialogsContext = createContext<DialogsContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useDialogs(): DialogsContextValue {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error("useDialogs must be used within <DialogsProvider>")
  return ctx
}

/**
 * Owns the app's dialogs (item capture/edit + space create/edit) so any button
 * anywhere can trigger them via useDialogs(). Rendered once near the app root.
 */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureSpace, setCaptureSpace] = useState<number | undefined>(undefined)
  const [editItem, setEditItem] = useState<Item | null>(null)

  const [spaceOpen, setSpaceOpen] = useState(false)
  const [spaceEdit, setSpaceEdit] = useState<Space | null>(null)
  const [spaceParent, setSpaceParent] = useState<number | null>(null)

  const value: DialogsContextValue = {
    openCapture: (defaultSpaceId) => {
      setCaptureSpace(defaultSpaceId)
      setCaptureOpen(true)
    },
    openItem: (item) => setEditItem(item),
    openSpaceCreate: (parentId) => {
      setSpaceEdit(null)
      setSpaceParent(parentId ?? null)
      setSpaceOpen(true)
    },
    openSpaceEdit: (space) => {
      setSpaceEdit(space)
      setSpaceParent(null)
      setSpaceOpen(true)
    },
  }

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <QuickCaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        defaultSpaceId={captureSpace}
      />
      <ItemEditDialog
        item={editItem}
        open={editItem !== null}
        onOpenChange={(o) => {
          if (!o) setEditItem(null)
        }}
      />
      <SpaceDialog
        open={spaceOpen}
        onOpenChange={setSpaceOpen}
        editSpace={spaceEdit}
        parentId={spaceParent}
      />
    </DialogsContext.Provider>
  )
}
