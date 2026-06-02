from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session, utcnow
from app.models import Space
from app.schemas import SpaceCreate, SpaceRead, SpaceUpdate

router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.get("", response_model=List[SpaceRead])
def list_spaces(session: Session = Depends(get_session)):
    spaces = session.exec(
        select(Space).where(Space.deleted_at.is_(None)).order_by(Space.position)
    ).all()
    return spaces


@router.post("", response_model=SpaceRead, status_code=status.HTTP_201_CREATED)
def create_space(payload: SpaceCreate, session: Session = Depends(get_session)):
    space = Space(**payload.model_dump())
    session.add(space)
    session.commit()
    session.refresh(space)
    return space


@router.get("/{space_id}", response_model=SpaceRead)
def get_space(space_id: int, session: Session = Depends(get_session)):
    space = session.get(Space, space_id)
    if not space or space.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


@router.patch("/{space_id}", response_model=SpaceRead)
def update_space(
    space_id: int, payload: SpaceUpdate, session: Session = Depends(get_session)
):
    space = session.get(Space, space_id)
    if not space or space.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Space not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(space, key, value)
    space.updated_at = utcnow()
    session.add(space)
    session.commit()
    session.refresh(space)
    return space


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(space_id: int, session: Session = Depends(get_session)):
    space = session.get(Space, space_id)
    if not space or space.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Space not found")
    space.deleted_at = utcnow()
    space.updated_at = utcnow()
    session.add(space)
    session.commit()
