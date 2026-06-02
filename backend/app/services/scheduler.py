"""APScheduler daily 'top-N' push digest (CLAUDE.md §8).

Once a day it computes the highest-priority active items and pushes them to every
stored subscription. Count + time are env-configurable. Dead subscriptions
(404/410) are pruned as we go.
"""

from __future__ import annotations

import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select

from app.db import engine
from app.models import Item, PushSubscription, Status
from app.services.push import send_push

scheduler = BackgroundScheduler()


def _top_active_titles(session: Session, n: int) -> list[str]:
    query = (
        select(Item)
        .join(Status, Item.status_id == Status.id)
        .where(Item.deleted_at.is_(None), Status.behavior == "active")
        .order_by(Item.priority.desc(), Item.position)
        .limit(n)
    )
    return [item.title for item in session.exec(query).all()]


def send_daily_digest() -> dict:
    """Compute the top-N active items and push them to all subscriptions.
    Returns a small summary (also used by the /api/push/test endpoint)."""
    count = int(os.getenv("DAILY_DIGEST_COUNT", "3"))
    with Session(engine) as session:
        titles = _top_active_titles(session, count)
        if titles:
            payload = {
                "title": f"Your top {len(titles)} for today",
                "body": " · ".join(titles),
                "url": "/",
            }
        else:
            payload = {
                "title": "Today",
                "body": "Nothing active — enjoy the breather 🎉",
                "url": "/",
            }

        subs = session.exec(select(PushSubscription)).all()
        sent = 0
        removed = 0
        for sub in subs:
            info = {
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            }
            status_code = send_push(info, payload)
            if status_code is None:
                sent += 1
            elif status_code in (404, 410):
                session.delete(sub)
                removed += 1
        if removed:
            session.commit()

        return {
            "subscriptions": len(subs),
            "sent": sent,
            "removed": removed,
            "preview": payload,
        }


def start_scheduler() -> None:
    hour = int(os.getenv("DAILY_DIGEST_HOUR", "8"))
    minute = int(os.getenv("DAILY_DIGEST_MINUTE", "0"))
    scheduler.add_job(
        send_daily_digest,
        CronTrigger(hour=hour, minute=minute),
        id="daily_digest",
        replace_existing=True,
    )
    if not scheduler.running:
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
