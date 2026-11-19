#!/usr/bin/env bash
set -euo pipefail

missing=0
while IFS= read -r name; do
  if ! grep -Fq "$name" README.md; then
    echo "missing from README.md: $name" >&2
    missing=1
  fi
done < <(grep -o '^[A-Z0-9_]*=' .env.example | tr -d '=')

if [ "$missing" -ne 0 ]; then
  exit 1
fi
echo "Every .env.example variable is documented in README.md"
