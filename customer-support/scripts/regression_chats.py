"""Re-run a stored WhatsApp suite against the local sales model."""
import argparse
import json
import os
import shutil
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'hermes/plugin'))
from fmi_support.regression import OPENING, remember, score, suite_by_id
from fmi_support.skill import talk


def play(home, case):
    history = [{'role': 'assistant', 'content': 'Hi\nYour name please?'}]
    turns = [dict(OPENING)]
    for text in case['turns']:
        started = time.monotonic()
        try:
            reply = talk(home, text, history)
            error = ''
        except Exception as exc:
            reply = ''
            error = type(exc).__name__ + ': ' + str(exc)
            traceback.print_exc()
        elapsed = round(time.monotonic() - started, 1)
        turns.append({'role': 'customer', 'text': text, 'seconds': elapsed, 'error': error})
        turns.append({'role': 'FMI', 'text': reply})
        history.append({'role': 'user', 'content': text})
        if reply:
            history.append({'role': 'assistant', 'content': reply})
        print(f"  {elapsed}s {text}", flush=True)
        print(f"     {reply[:160]!r} {error}", flush=True)
    return turns


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', default='payment-loop-2')
    parser.add_argument('--home', type=Path, default=None)
    args = parser.parse_args()
    home = args.home or Path('/tmp/fmi-regression-home')
    if home == Path('/tmp/fmi-regression-home'):
        if home.exists():
            shutil.rmtree(home)
        home.mkdir()
        shutil.copy(Path(os.environ.get('HERMES_HOME', Path.home() / '.hermes')).expanduser() / 'fmi-support-model.json', home / 'fmi-support-model.json')
    suite = suite_by_id(args.suite)
    results = []
    started = time.monotonic()
    for index, case in enumerate(suite['cases'], 1):
        print(f"CASE {index} {case['title']}", flush=True)
        turns = play(home, case)
        failed = score(case, turns)
        results.append({'id': case['id'], 'title': case['title'], 'failed': failed, 'turns': turns})
        print('  ', 'PASS' if not failed else 'FAIL ' + ','.join(failed), flush=True)
    report = {'suite': suite['id'], 'seconds': round(time.monotonic() - started, 1), 'results': results}
    destination = ROOT / 'regression' / ('last_run_' + suite['id'] + '.json')
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    row = remember(suite['id'], results)
    print('LEARNING', json.dumps(row), flush=True)
    print('REPORT', destination, flush=True)
    if row['passed'] != row['total']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
