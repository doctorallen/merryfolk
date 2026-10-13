#!/bin/sh
# Static checks: every script parses, index.html and js/ agree with each
# other, and the type checker is happy with the files that opt in.
set -e
cd "$(dirname "$0")/.."

for f in js/*.js; do node --check "$f"; done

grep -o 'src="js/[^"]*"' index.html | cut -d'"' -f2 | while read -r f; do
  test -f "$f" || { echo "index.html names a missing script: $f"; exit 1; }
done
for f in js/*.js; do
  grep -q "src=\"$f\"" index.html || { echo "$f is not loaded by index.html"; exit 1; }
done

# the talk packs: each parses, and the engine's manifest names exactly the files there are
for f in talk/*.js; do node --check "$f"; done
manifest=$(grep -o "TALK_MANIFEST = \[[^]]*\]" js/threads.js | grep -o "'[a-z0-9_]*'" | tr -d "'" | sort)
files=$(ls talk/*.js 2>/dev/null | sed 's#talk/##; s#\.js$##' | sort)
if [ "$manifest" != "$files" ]; then echo "talk packs and TALK_MANIFEST disagree: manifest [$manifest] files [$files]"; exit 1; fi

# every file shares one global scope, so a function or top-level const declared
# in two files silently replaces the first (as a journey's presentFor once
# replaced the birthday one)
dups=$(grep -hoE '^(function|const|let|class) [A-Za-z0-9_$]+' js/*.js | awk '{print $2}' | sort | uniq -d)
if [ -n "$dups" ]; then echo "declared in more than one file: $dups"; exit 1; fi

if [ -f tsconfig.json ]; then
  if [ -x node_modules/.bin/tsc ]; then node_modules/.bin/tsc -p .; else npx -y typescript@5 tsc -p .; fi
fi
echo "check: ok"
