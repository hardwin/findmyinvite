import test from 'node:test';
import assert from 'node:assert/strict';
import {readOwnerPeriod, resolveOwnerPeriod, inOwnerWindow, orderPeriodActivity, sameTimeSales} from '../shared/owner-period.mjs';

const now = Date.parse('2026-11-17T19:15:00Z'); // 18 November, 00:45 IST
const rangeFor = query => resolveOwnerPeriod(readOwnerPeriod(new URLSearchParams(query)), now);

test('default, rolling links, yesterday and custom use inclusive IST calendar dates', () => {
  const today = rangeFor('');
  assert.equal(today.period, 'today');
  assert.equal(today.start, '2026-11-18');
  assert.equal(inOwnerWindow('2026-11-17T18:29:59.999Z', today), false);
  assert.equal(inOwnerWindow('2026-11-17T18:30:00Z', today), true);
  assert.equal(inOwnerWindow(new Date(now + 1).toISOString(), today), false);
  const yesterday = rangeFor('period=yesterday');
  assert.equal(yesterday.end, '2026-11-17');
  assert.equal(inOwnerWindow('2026-11-17T18:29:59.999Z', yesterday), true);
  assert.equal(inOwnerWindow('2026-11-17T18:30:00Z', yesterday), false);
  assert.equal(rangeFor('days=7').start, '2026-11-12');
  assert.equal(rangeFor('days=30').start, '2026-10-20');
  const custom = rangeFor('period=custom&from=2026-10-31&to=2026-11-02');
  assert.equal(custom.days, 3);
  assert.equal(custom.previousStart, '2026-10-28');
  assert.equal(custom.previousEnd, '2026-10-30');
  for (const invalid of ['days=1.5','days=0','period=custom&from=2026-02-30&to=2026-11-01','period=custom&from=2026-11-02&to=2026-11-01','period=custom&from=2026-11-02&to=2026-12-01']) {
    assert.throws(()=>rangeFor(invalid), {status:400});
  }
});

test('Sales uses dated payment or refund activity and keeps undated historical captures out of the period', () => {
  const range = rangeFor('');
  const pending = {status:'created', created_at:'2026-11-17T19:01:00Z'};
  assert.equal(orderPeriodActivity(pending,range).activity_at, pending.created_at);
  assert.equal(orderPeriodActivity({...pending, status:'captured'},range), null);
  const applied = {...pending,status:'captured',created_at:'2026-10-01T00:00:00Z',reporting_at:'2026-11-17T19:05:00Z'};
  assert.equal(orderPeriodActivity(applied,range).activity_at, applied.reporting_at);
  assert.equal(orderPeriodActivity({...applied, reporting_at:'2026-11-16T00:00:00Z'},range), null);
  const refund = {...applied,status:'refunded',reporting_at:'2026-11-13T07:00:00Z',refunded_at:'2026-11-17T19:10:00Z'};
  assert.deepEqual(orderPeriodActivity(refund,range), {activity_at:refund.refunded_at,activity_basis:'Refund'});
});

test('intraday compares online collections only through the same clock time yesterday', () => {
  const orders = ['2026-11-17T19:15:00Z','2026-11-16T18:30:00Z','2026-11-16T19:15:00Z','2026-11-16T19:15:00.001Z'].map(reporting_at=>({status:'captured',amount:100,reporting_at}));
  orders.push({status:'created', amount:1000, reporting_at:'2026-11-17T18:45:00Z'});
  assert.deepEqual(sameTimeSales(orders, rangeFor('')), {asOf:new Date(now).toISOString(),today:{count:1,amount:100},yesterday:{count:2,amount:200}});
  assert.equal(sameTimeSales(orders,rangeFor('period=yesterday')), null);
});
