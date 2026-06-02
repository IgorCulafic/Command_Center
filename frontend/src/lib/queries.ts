import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  api,
  type ItemCreate,
  type ItemFilters,
  type ItemUpdate,
  type SpaceCreate,
  type SpaceUpdate,
  type StatusCreate,
  type StatusSetCreate,
  type StatusSetUpdate,
  type StatusUpdate,
} from "./api"
import { buildStatusIndex } from "./status"

/** All non-deleted spaces (flat). Build the tree with buildSpaceTree(). */
export function useSpaces() {
  return useQuery({ queryKey: ["spaces"], queryFn: api.listSpaces })
}

/** Items, optionally filtered by space / type / status behavior. */
export function useItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: ["items", filters ?? null],
    queryFn: () => api.listItems(filters),
  })
}

export function useStatusSets() {
  return useQuery({ queryKey: ["status-sets"], queryFn: api.listStatusSets })
}

export function useStatuses(setId: number | null | undefined) {
  return useQuery({
    queryKey: ["statuses", setId],
    queryFn: () => api.listStatuses(setId as number),
    enabled: setId != null,
  })
}

/** Every status across all sets. */
export function useAllStatuses() {
  return useQuery({ queryKey: ["statuses", "all"], queryFn: api.listAllStatuses })
}

/** Memoized lookup index over the full status vocabulary. */
export function useStatusIndex() {
  const { data } = useAllStatuses()
  return useMemo(() => buildStatusIndex(data ?? []), [data])
}

/**
 * Patch an item. Invalidates every items query so the Today feed, space views,
 * and deadline rail all reflect the change (e.g. a completed item leaving the
 * active list). The backend keeps completed_at in sync with status behavior.
 */
export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ItemCreate) => api.createItem(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ItemUpdate }) =>
      api.updateItem(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

// ── Attachments ────────────────────────────────────────────────────────────────

export function useAttachments(params: { item_id?: number; space_id?: number }) {
  return useQuery({
    queryKey: ["attachments", params],
    queryFn: () => api.listAttachments(params),
  })
}

export function useUploadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      target,
    }: {
      file: File
      target: { item_id?: number; space_id?: number }
    }) => api.uploadAttachment(file, target),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments"] }),
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments"] }),
  })
}

// ── Status-set editor mutations ───────────────────────────────────────────────
// Status changes ripple into item rendering (colours/labels), so these
// invalidate "statuses" and "status-sets" (and "spaces" for assignment).

function useInvalidateStatuses() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["statuses"] })
    qc.invalidateQueries({ queryKey: ["status-sets"] })
    qc.invalidateQueries({ queryKey: ["items"] })
  }
}

export function useCreateStatusSet() {
  const invalidate = useInvalidateStatuses()
  return useMutation({
    mutationFn: (body: StatusSetCreate) => api.createStatusSet(body),
    onSuccess: invalidate,
  })
}

export function useUpdateStatusSet() {
  const invalidate = useInvalidateStatuses()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: StatusSetUpdate }) =>
      api.updateStatusSet(id, body),
    onSuccess: invalidate,
  })
}

export function useCreateStatus() {
  const invalidate = useInvalidateStatuses()
  return useMutation({
    mutationFn: ({ setId, body }: { setId: number; body: StatusCreate }) =>
      api.createStatus(setId, body),
    onSuccess: invalidate,
  })
}

export function useUpdateStatus() {
  const invalidate = useInvalidateStatuses()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: StatusUpdate }) =>
      api.updateStatus(id, body),
    onSuccess: invalidate,
  })
}

export function useDeleteStatus() {
  const invalidate = useInvalidateStatuses()
  return useMutation({
    mutationFn: (id: number) => api.deleteStatus(id),
    onSuccess: invalidate,
  })
}

export function useUpdateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SpaceUpdate }) =>
      api.updateSpace(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] })
      qc.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SpaceCreate) => api.createSpace(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteSpace(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] })
      qc.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
