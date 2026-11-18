import {businessDay} from './owner-metrics.mjs';

const DAY = 86_400_000;
const midnight = date => Date.parse(date + 'T00:00:00+05:30');

function invalidPeriod(message) {
  throw Object.assign(new Error(message), {status: 400});
}

function validDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(midnight(date)) && businessDay(midnight(date)) === date;
}

export function readOwnerPeriod(params) {
  const period = params.get('period');
  if (period === 'custom') return {period, from: params.get('from'), to: params.get('to')};
  if (period === 'yesterday' || period === 'today') return {period};
  if (period) invalidPeriod('Choose a valid reporting period.');
  const days = Number(params.get('days') ?? 1);
  if (!Number.isInteger(days) || days < 1 || days > 365) invalidPeriod('Choose a reporting period between 1 and 365 days.');
  return days === 1 ? {period: 'today'} : {period: 'rolling', days};
}

export function periodQueryOf(selection) {
  if (selection.period === 'custom') return new URLSearchParams({period: 'custom', from: selection.from, to: selection.to}).toString();
  return selection.period === 'rolling' ? 'days=' + selection.days : 'period=' + selection.period;
}

export function resolveOwnerPeriod(selection = {period: 'today'}, now = Date.now()) {
  if (typeof selection === 'number') selection = readOwnerPeriod(new URLSearchParams({days: String(selection)}));
  const today = businessDay(now);
  let end = today, start = today;
  if (selection.period === 'custom') {
    start = selection.from;
    end = selection.to;
    if (!validDate(start) || !validDate(end) || start > end || end > today) {
      invalidPeriod('Choose valid start and end dates through today.');
    }
    if (midnight(end) - midnight(start) >= 365 * DAY) invalidPeriod('Choose a custom range of up to 365 days.');
  } else if (selection.period === 'yesterday') {
    start = end = businessDay(now - DAY);
  } else if (selection.period === 'rolling') {
    start = businessDay(now - (selection.days - 1) * DAY);
  }
  const fromMs = midnight(start), lastDayMs = midnight(end), days = 1 + (lastDayMs - fromMs) / DAY;
  return {
    period: selection.period, start, end, days, fromMs, untilMs: Math.min(now + 1, lastDayMs + DAY),
    previousStart: businessDay(fromMs - days * DAY), previousEnd: businessDay(fromMs - DAY)
  };
}

export function inOwnerWindow(value, range) {
  const time = Date.parse(value);
  return time >= range.fromMs && time < range.untilMs;
}

export function orderPeriodActivity(order, range) {
  if (order.status === 'refunded' && inOwnerWindow(order.refunded_at, range)) {
    return {activity_at: order.refunded_at, activity_basis: 'Refund'};
  }
  if (order.status === 'captured' || order.status === 'refunded') {
    const paidAt = order.reporting_at || order.captured_at || order.applied_at;
    return inOwnerWindow(paidAt, range) ? {activity_at: paidAt, activity_basis: order.reporting_basis || 'Payment'} : null;
  }
  return inOwnerWindow(order.created_at, range) ? {activity_at: order.created_at, activity_basis: 'Order created'} : null;
}

// Manual receipts have a business date only. Compare online collections with a known reporting timestamp.
export function sameTimeSales(orders, range) {
  if (range.period !== 'today') return null;
  function collections(fromMs, untilMs) {
    const rows = orders.filter(o => ['captured', 'refunded'].includes(o.status)
      && inOwnerWindow(o.reporting_at || o.captured_at || o.applied_at, {fromMs, untilMs}));
    return {count: rows.length, amount: rows.reduce((sum, order) => sum + order.amount, 0)};
  }
  return {
    asOf: new Date(range.untilMs - 1).toISOString(),
    today: collections(range.fromMs, range.untilMs),
    yesterday: collections(range.fromMs - DAY, range.untilMs - DAY)
  };
}
