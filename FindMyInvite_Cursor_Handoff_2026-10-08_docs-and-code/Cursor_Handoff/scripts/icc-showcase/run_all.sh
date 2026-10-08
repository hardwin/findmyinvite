#!/bin/bash
# Generate scenes 1-12 + promo 13 (text-only). Stops at the first billing error (exit 3).
cd "$(dirname "$0")/.."
for n in ${@:-1 2 3 4 5 6 7 8 9 10 11 12 13}; do
  python3 scripts/gen_still.py $n; rc=$?
  [ $rc -eq 3 ] && { echo "STOPPED on billing at scene $n"; exit 3; }
done
