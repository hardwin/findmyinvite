"""Stored WhatsApp chat cases. Re-run these before a sales change lands."""
import json
from datetime import datetime, timezone
from pathlib import Path

from .voice import LISTED_AMOUNT,PAID_CLAIM,PAID_CONFIRM,PAYMENT_URL,rupee_amounts

ROOT = Path(__file__).resolve().parents[3] / 'regression'
CASES = ROOT / 'chat_cases.json'
LEARNING = ROOT / 'learning.jsonl'
OPENING = {'role': 'FMI', 'text': 'Hi\nYour name please?'}


def load_suites():
    data = json.loads(CASES.read_text(encoding='utf-8'))
    return data['suites']


def suite_by_id(suite_id):
    for suite in load_suites():
        if suite['id'] == suite_id:
            return suite
    raise KeyError(suite_id)


def _fmi_after(turns, customer_text):
    seen = False
    for turn in turns:
        if seen and turn['role'] == 'FMI':
            return turn['text']
        if turn['role'] == 'customer' and turn['text'] == customer_text:
            seen = True
    return ''


def score(case, turns):
    """Invariant checks. Wording may change. These outcomes may not."""
    checks = case['checks']
    replies = [turn['text'] for turn in turns if turn['role'] == 'FMI' and turn['text'] != OPENING['text']]
    blob = '\n'.join(replies)
    failed = []
    if checks.get('no_rupee') and any(amount not in LISTED_AMOUNT for amount in rupee_amounts(blob)):
        failed.append('rupee')
    if checks.get('no_template') and 'template' in blob.casefold():
        failed.append('template')
    if checks.get('no_tool_leak') and 'gender tool' in blob.casefold():
        failed.append('tool_leak')
    paid_reply = ''
    for turn in case['turns']:
        if PAID_CLAIM.search(turn):
            paid_reply = _fmi_after(turns, turn)
    if checks.get('no_paid_confirm') and paid_reply and (PAID_CONFIRM.search(paid_reply) or 'verified' in paid_reply.casefold()):
        failed.append('paid_confirm')
    if checks.get('paid_asks_time') and 'time' not in paid_reply.casefold():
        failed.append('paid_time')
    linked = PAYMENT_URL in blob
    if checks.get('expect_link') and not linked:
        failed.append('missing_link')
    if checks.get('expect_link') is False and linked:
        failed.append('early_link')
    return failed


def remember(suite_id, results):
    LEARNING.parent.mkdir(parents=True, exist_ok=True)
    row = {'at': datetime.now(timezone.utc).isoformat(), 'suite': suite_id,
           'passed': sum(1 for item in results if not item['failed']),
           'total': len(results),
           'failed': [item['id'] for item in results if item['failed']]}
    with LEARNING.open('a', encoding='utf-8') as stream:
        stream.write(json.dumps(row) + '\n')
    return row
