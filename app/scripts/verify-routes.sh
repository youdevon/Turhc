#!/usr/bin/env bash
# Smoke-test public and admin routes (expects dev server on PORT).
set -euo pipefail
PORT="${PORT:-3010}"
BASE="${BASE:-http://localhost:$PORT}"
FAIL=0

routes=(
  "/"
  "/about"
  "/contact"
  "/projects"
  "/projects/affordable-housing-phase-1"
  "/tenders"
  "/tenders/capital-water-treatment-main-contract"
  "/news"
  "/news/northern-highway-68-percent"
  "/governance"
  "/governance/board"
  "/governance/leadership"
  "/governance/annual-reports"
  "/governance/procurement-policies"
  "/governance/freedom-of-information"
  "/governance/documents"
  "/contractors"
  "/contractors/registration"
  "/contractors/prequalification"
  "/contractors/work-categories"
  "/contractors/tender-alerts"
  "/contractors/how-to-bid"
  "/contractors/faqs"
  "/admin/login"
)

echo "Verifying routes on $BASE ..."
for route in "${routes[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE$route" || echo "000")
  if [[ "$code" =~ ^(200|307|308)$ ]]; then
    echo "  OK $route ($code)"
  else
    echo "  FAIL $route ($code)"
    FAIL=1
  fi
done

# Admin routes should redirect unauthenticated users to login
admin_routes=(
  "/admin"
  "/admin/dashboard"
  "/admin/projects"
  "/admin/tenders"
  "/admin/news"
  "/admin/documents"
  "/admin/media"
  "/admin/enquiries"
)

echo ""
echo "Verifying admin redirects (unauthenticated) ..."
for route in "${admin_routes[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$route" || echo "000")
  if [[ "$code" =~ ^(307|308|302|303)$ ]]; then
    echo "  OK $route → login ($code)"
  else
    echo "  FAIL $route (expected redirect, got $code)"
    FAIL=1
  fi
done

if [[ $FAIL -eq 0 ]]; then
  echo ""
  echo "All routes OK."
else
  echo ""
  echo "Some routes failed."
  exit 1
fi
