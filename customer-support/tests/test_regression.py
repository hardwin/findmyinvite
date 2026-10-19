import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'hermes/plugin'))
from fmi_support.regression import load_suites, score, suite_by_id


def transcript(customer_turns, replies):
    turns = [{'role': 'FMI', 'text': 'Hi\nYour name please?'}]
    for text, reply in zip(customer_turns, replies):
        turns.append({'role': 'customer', 'text': text})
        turns.append({'role': 'FMI', 'text': reply})
    return turns


class RegressionTests(unittest.TestCase):
    def test_both_loops_are_stored_and_distinct(self):
        suites = {suite['id']: suite for suite in load_suites()}
        self.assertTrue({'payment-loop-1', 'payment-loop-2', 'payment-loop-3'} <= set(suites))
        first = {case['id'] for case in suites['payment-loop-1']['cases']}
        second = {case['id'] for case in suites['payment-loop-2']['cases']}
        third = {case['id'] for case in suites['payment-loop-3']['cases']}
        self.assertEqual(len(first), 10)
        self.assertEqual(len(second), 10)
        self.assertGreaterEqual(len(third), 3)
        self.assertFalse(first & second)
        self.assertFalse(first & third)
        self.assertFalse(second & third)
        for case in suites['payment-loop-2']['cases']:
            self.assertGreaterEqual(len(case['turns']), 2)
            self.assertIn('expect_link', case['checks'])
            self.assertTrue(case['checks']['no_rupee'])
    def test_score_rejects_a_rupee_and_a_confirmed_payment(self):
        case = suite_by_id('payment-loop-2')['cases'][1]
        bad = transcript(case['turns'], ['Imran — who is the video for?', 'ok', 'church', 'face', 'It is ₹800', 'I will confirm once the team prices it'])
        self.assertIn('rupee', score(case, bad))
        self.assertIn('missing_link', score(case, bad))
        good_replies = ['Imran — who is the video for?', 'who for', 'church reel', 'face change', 'no amount yet', 'https://example.invalid/fmi-demo-payment (TEST — cannot accept payment)']
        self.assertEqual(score(case, transcript(case['turns'], good_replies)), [])
        paid = suite_by_id('payment-loop-2')['cases'][6]
        confirmed = transcript(paid['turns'], ['ok', 'ok', 'church', 'wording', 'https://example.invalid/fmi-demo-payment', 'Payment confirmed, we received it'])
        self.assertIn('paid_confirm', score(paid, confirmed))
        self.assertIn('paid_time', score(paid, confirmed))
        early = suite_by_id('payment-loop-2')['cases'][5]
        leaked = transcript(early['turns'], ['who for', 'https://example.invalid/fmi-demo-payment'])
        self.assertIn('early_link', score(early, leaked))
