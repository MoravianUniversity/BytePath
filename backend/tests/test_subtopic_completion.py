"""Slot-credit completion must match the live two-correct-after-wrong rule."""

from types import SimpleNamespace

from backend.services.subtopic_completion import (
    completion_credits_by_type,
    slot_progress,
    slots_for_topic,
)


def _resp(subtopic_type: str, is_correct: bool, *, ts: float, rid: int):
    return SimpleNamespace(
        subtopic_type=subtopic_type,
        is_correct=is_correct,
        attempted_at=SimpleNamespace(timestamp=lambda: ts),
        id=rid,
    )


def test_wrong_then_one_correct_earns_no_credit():
    responses = [
        _resp("A", False, ts=1, rid=1),
        _resp("A", True, ts=2, rid=2),
    ]
    assert completion_credits_by_type(responses) == {"A": 0}


def test_wrong_then_two_correct_earns_one_credit():
    responses = [
        _resp("A", False, ts=1, rid=1),
        _resp("A", True, ts=2, rid=2),
        _resp("A", True, ts=3, rid=3),
    ]
    assert completion_credits_by_type(responses) == {"A": 1}


def test_duplicate_slots_need_two_credits():
    slots = ["A", "B", "A"]
    responses = [
        _resp("A", True, ts=1, rid=1),
        _resp("B", True, ts=2, rid=2),
    ]
    completed, remaining, count = slot_progress(slots, responses)
    assert completed == ["A", "B"]
    assert remaining == ["A"]
    assert count == 2

    responses.append(_resp("A", True, ts=3, rid=3))
    completed, remaining, count = slot_progress(slots, responses)
    assert completed == ["A", "B", "A"]
    assert remaining == []
    assert count == 3


def test_extra_corrects_after_wrong_cycle_earn_second_duplicate_credit():
    slots = ["StringIndex1", "StringIndex1"]
    responses = [
        _resp("StringIndex1", True, ts=1, rid=1),
        _resp("StringIndex1", False, ts=2, rid=2),
        _resp("StringIndex1", True, ts=3, rid=3),
        _resp("StringIndex1", True, ts=4, rid=4),
    ]
    completed, remaining, count = slot_progress(slots, responses)
    assert count == 2
    assert remaining == []
    assert completed == slots


def test_slots_for_topic_reads_frontend_topic_sources():
    slots = slots_for_topic("string-index")
    assert slots.count("StringIndex1") == 2
    assert slots.count("StringIndex0") == 2
    assert len(slots) == 10
