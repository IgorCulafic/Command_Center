from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.db import get_session, utcnow
from app.models import Item, Space, Status, StatusSet
from app.schemas import ItemCreate, ItemRead, ItemUpdate

router = APIRouter(prefix="/items", tags=["items"])

# Types that carry a checkable status; notes/links/events don't.
_STATUSED_TYPES = {"task", "opportunity"}


def _default_status_id(session: Session, space_id: int, item_type: str) -> int | None:
    """The first active status of the item's space's set — so a freshly created
    task/opportunity is immediately live (shows in Today, gets a marker) instead
    of landing without a status."""
    if item_type not in _STATUSED_TYPES:
        return None
    space = session.get(Space, space_id)
    set_id = space.status_set_id if space and space.status_set_id else None
    if set_id is None:
        default_set = session.exec(
            select(StatusSet).where(StatusSet.is_default)
        ).first()
        set_id = default_set.id if default_set else None
    if set_id is None:
        return None
    statuses = session.exec(
        select(Status)
        .where(Status.status_set_id == set_id)
        .order_by(Status.position)
    ).all()
    active = [s for s in statuses if s.behavior == "active"]
    if active:
        return active[0].id
    return statuses[0].id if statuses else None


def _item_to_read(item: Item) -> ItemRead:
    return ItemRead(
        id=item.id,
        space_id=item.space_id,
        type=item.type,
        title=item.title,
        body=item.body,
        status_id=item.status_id,
        priority=item.priority,
        due_at=item.due_at,
        remind_at=item.remind_at,
        position=item.position,
        is_pinned=item.is_pinned,
        metadata=item.metadata_ or {},
        created_at=item.created_at,
        updated_at=item.updated_at,
        completed_at=item.completed_at,
        deleted_at=item.deleted_at,
    )


@router.get("", response_model=List[ItemRead])
def list_items(
    space_id: Optional[int] = Query(default=None),
    type: Optional[str] = Query(default=None),
    behavior: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
):
    query = select(Item).where(Item.deleted_at.is_(None))
    if space_id is not None:
        query = query.where(Item.space_id == space_id)
    if type is not None:
        query = query.where(Item.type == type)
    if behavior is not None:
        # Join to Status to filter by behavior
        query = query.join(Status, Item.status_id == Status.id).where(
            Status.behavior == behavior
        )
    query = query.order_by(Item.priority.desc(), Item.position)
    items = session.exec(query).all()
    return [_item_to_read(i) for i in items]


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, session: Session = Depends(get_session)):
    data = payload.model_dump()
    metadata = data.pop("metadata", {})
    if data.get("status_id") is None:
        data["status_id"] = _default_status_id(session, data["space_id"], data["type"])
    item = Item(**data, metadata_=metadata)
    session.add(item)
    session.commit()
    session.refresh(item)
    return _item_to_read(item)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Item, item_id)
    if not item or item.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_read(item)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(
    item_id: int, payload: ItemUpdate, session: Session = Depends(get_session)
):
    item = session.get(Item, item_id)
    if not item or item.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        item.metadata_ = update_data.pop("metadata")

    # When the status changes, keep completed_at in sync with the new status's
    # behavior: closing an item (done / dismissed) stamps it; reopening clears
    # it. The app keys "Completed" off behavior (CLAUDE.md §7), and completed_at
    # gives a stable timestamp to order closed items by. An explicit completed_at
    # in the payload always wins.
    if "status_id" in update_data and "completed_at" not in update_data:
        new_status_id = update_data["status_id"]
        new_status = (
            session.get(Status, new_status_id) if new_status_id is not None else None
        )
        behavior = new_status.behavior if new_status else None
        if behavior in ("done", "dismissed"):
            item.completed_at = item.completed_at or utcnow()
        else:
            item.completed_at = None

    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _item_to_read(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Item, item_id)
    if not item or item.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Item not found")
    item.deleted_at = utcnow()
    item.updated_at = utcnow()
    session.add(item)
    session.commit()
