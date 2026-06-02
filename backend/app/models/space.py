from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.db import utcnow


class Space(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = Field(default=None, foreign_key="space.id")
    position: int = 0
    is_pinned: bool = False
    is_favorite: bool = False
    status_set_id: Optional[int] = Field(default=None, foreign_key="statusset.id")
    notifications_muted: bool = False
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    deleted_at: Optional[datetime] = None
