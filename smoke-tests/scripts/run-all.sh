#!/usr/bin/env bash
# Runs all 16 sub-projects sequentially; prints a summary table at the end.
set -e

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECTS_DIR="$SCRIPTS_DIR/../projects"

declare -A RESULTS

run_project() {
  local name="$1"
  local dir="$PROJECTS_DIR/$name"
  echo ""
  echo "========================================="
  echo "  $name"
  echo "========================================="
  if (cd "$dir" && npm install --prefer-offline && npm test); then
    RESULTS["$name"]="PASS"
  else
    RESULTS["$name"]="FAIL"
  fi
}

# Vite variants
run_project "react-16-vite"
run_project "react-17-vite"
run_project "react-18-vite"
run_project "react-19-vite"
# CRA variants (React 16–18; React 19 unsupported by react-scripts)
run_project "react-16-cra"
run_project "react-17-cra"
run_project "react-18-cra"
# webpack (hand-rolled) variants
run_project "react-16-webpack"
run_project "react-17-webpack"
run_project "react-18-webpack"
run_project "react-19-webpack"
# Remix variants (React 17+; React 16 unsupported by Remix)
run_project "react-17-remix"
run_project "react-18-remix"
run_project "react-19-remix"
# Next.js variants
run_project "react-18-nextjs"
run_project "react-19-nextjs"

echo ""
echo "========================================="
echo "  SMOKE TEST MATRIX RESULTS"
echo "========================================="
FAILED=0
for name in \
  "react-16-vite" "react-17-vite" "react-18-vite" "react-19-vite" \
  "react-16-cra" "react-17-cra" "react-18-cra" \
  "react-16-webpack" "react-17-webpack" "react-18-webpack" "react-19-webpack" \
  "react-17-remix" "react-18-remix" "react-19-remix" \
  "react-18-nextjs" "react-19-nextjs"; do
  STATUS="${RESULTS[$name]:-SKIP}"
  echo "  $STATUS  $name"
  [[ "$STATUS" == "FAIL" ]] && FAILED=$((FAILED + 1))
done
echo ""
[[ $FAILED -eq 0 ]] && echo "All 16 projects PASSED" && exit 0
echo "$FAILED project(s) FAILED" && exit 1
