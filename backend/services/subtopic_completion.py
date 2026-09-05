"""Shared rules for deriving per-slot subtopic completion from response history.

Live answering updates one topic-slot instance at a time with:
  completed = False if incorrectLastTime else isCorrect
  incorrectLastTime = not isCorrect

Responses only store subtopic_type (constructor name), not which duplicate
slot was shown. To reconstruct slot completion we count "completion credits":
each response that leaves the type's state machine in completed=True earns one
credit. Those credits fill slots of that type in catalog order.

Example: String Indexing lists StringIndex0 twice, so two credits are required
before both slots count as done. A wrong answer followed by one correct does
not earn a credit (same as live UI).

Slot catalogs are read from the frontend topic sources under src/topics/*.ts
(the same place topic contents are defined).
"""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

_TOPIC_CTOR_RE = re.compile(
    r"new Topic\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"][^'\"]*['\"]\s*,\s*\[(.*?)\]",
    re.S,
)
_SUBTOPIC_CTOR_RE = re.compile(r"new\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(")


def _response_sort_key(response) -> tuple:
    attempted_at = getattr(response, "attempted_at", None)
    response_id = getattr(response, "id", None) or 0
    if isinstance(attempted_at, datetime):
        stamp = attempted_at.timestamp()
    else:
        stamp = 0
    return (stamp, response_id)


def completion_credits_by_type(responses: Iterable) -> Dict[str, int]:
    """How many slot-credits each subtopic_type has earned."""
    by_type: Dict[str, list] = defaultdict(list)
    for response in responses:
        subtopic_type = getattr(response, "subtopic_type", None)
        if not subtopic_type:
            continue
        by_type[subtopic_type].append(response)

    credits: Dict[str, int] = {}
    for subtopic_type, typed_responses in by_type.items():
        incorrect_last_time = False
        earned = 0
        for response in sorted(typed_responses, key=_response_sort_key):
            is_correct = bool(getattr(response, "is_correct", False))
            is_complete = False if incorrect_last_time else is_correct
            incorrect_last_time = not is_correct
            if is_complete:
                earned += 1
        credits[subtopic_type] = earned
    return credits


def apply_credits_to_slots(
    slots: Sequence[str], credits: Dict[str, int]
) -> Tuple[List[str], List[str], int]:
    """Fill catalog slots in order using per-type credits.

    Returns (completed_slots, remaining_slots, completed_count).
    """
    remaining_credits = dict(credits)
    completed_slots: List[str] = []
    remaining_slots: List[str] = []
    for slot in slots:
        available = remaining_credits.get(slot, 0)
        if available > 0:
            completed_slots.append(slot)
            remaining_credits[slot] = available - 1
        else:
            remaining_slots.append(slot)
    return completed_slots, remaining_slots, len(completed_slots)


def slot_progress(
    slots: Sequence[str], responses: Iterable
) -> Tuple[List[str], List[str], int]:
    credits = completion_credits_by_type(responses)
    return apply_credits_to_slots(slots, credits)


def _topics_source_dir() -> Path:
    # backend/services/this_file.py -> repo root / src / topics
    return Path(__file__).resolve().parents[2] / "src" / "topics"


@lru_cache(maxsize=1)
def load_topic_subtopic_slots() -> Dict[str, List[str]]:
    """Parse `new Topic('id', 'Name', [new Foo(), ...])` from frontend sources."""
    slots: Dict[str, List[str]] = {}
    topics_dir = _topics_source_dir()
    if not topics_dir.is_dir():
        return slots

    for path in topics_dir.glob("*.ts"):
        text = path.read_text(encoding="utf-8")
        for match in _TOPIC_CTOR_RE.finditer(text):
            topic_id = match.group(1)
            names = _SUBTOPIC_CTOR_RE.findall(match.group(2))
            if names:
                slots[topic_id] = names
    return slots


def slots_for_topic(topic_id: str) -> List[str]:
    return list(load_topic_subtopic_slots().get(topic_id, []))
