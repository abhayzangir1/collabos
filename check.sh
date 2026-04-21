#!/bin/bash
# CollabOS Health Check Script
# Usage: bash check.sh

set -e

echo "========================================="
echo "  CollabOS — Health Check"
echo "========================================="
echo ""

# 1. Check Node.js
echo "[1/6] Node.js..."
if command -v node &>/dev/null; then
  echo "  ✅ Node.js $(node -v)"
else
  echo "  ❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# 2. Check pnpm
echo "[2/6] pnpm..."
if command -v pnpm &>/dev/null; then
  echo "  ✅ pnpm $(pnpm -v)"
else
  echo "  ⚠️  pnpm not found. Install: npm i -g pnpm"
fi

# 3. Check .env
echo "[3/6] Environment..."
if [ -f ".env" ]; then
  if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "  ✅ .env file found with Supabase vars"
  else
    echo "  ⚠️  .env exists but missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  fi
else
  echo "  ❌ .env file not found. Copy .env.example to .env and fill in your Supabase credentials."
fi

# 4. Check dependencies
echo "[4/6] Dependencies..."
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules exists"
else
  echo "  ⚠️  node_modules not found. Run: pnpm install"
fi

# 5. TypeScript check
echo "[5/6] TypeScript..."
if [ -d "node_modules" ]; then
  npx tsc --noEmit 2>/dev/null && echo "  ✅ No TypeScript errors" || echo "  ⚠️  TypeScript errors found (run: npx tsc --noEmit)"
else
  echo "  ⏭️  Skipped (no node_modules)"
fi

# 6. File structure check
echo "[6/6] File Structure..."
REQUIRED_FILES=(
  "src/main.tsx"
  "src/App.tsx"
  "src/index.css"
  "src/lib/supabase.ts"
  "src/lib/constants.ts"
  "src/lib/utils.ts"
  "src/store/index.ts"
  "src/types/database.ts"
  "src/i18n/index.ts"
  "src/i18n/en.ts"
  "src/i18n/es.ts"
  "src/i18n/hi.ts"
  "src/data/skillTags.ts"
  "src/data/knowledgeBase.ts"
  "src/hooks/useAuth.ts"
  "src/hooks/useRealtime.ts"
  "src/hooks/useProofs.ts"
  "src/hooks/useTrades.ts"
  "src/hooks/useListings.ts"
  "src/hooks/useWorkspaces.ts"
  "src/hooks/useAnalytics.ts"
  "src/components/layout/Sidebar.tsx"
  "src/components/layout/AppLayout.tsx"
  "src/components/ui/SkillTagInput.tsx"
  "src/components/ui/ErrorBoundary.tsx"
  "src/components/ui/Modal.tsx"
  "src/components/trades/DisputePanel.tsx"
  "src/pages/Landing.tsx"
  "src/pages/Login.tsx"
  "src/pages/Register.tsx"
  "src/pages/VerifyEmail.tsx"
  "src/pages/Dashboard.tsx"
  "src/pages/ProofChain.tsx"
  "src/pages/Market.tsx"
  "src/pages/TradeHub.tsx"
  "src/pages/TradeDetail.tsx"
  "src/pages/Analytics.tsx"
  "src/pages/Workspaces.tsx"
  "src/pages/WorkspaceDetail.tsx"
  "src/pages/KnowledgeBase.tsx"
  "src/pages/Settings.tsx"
  "supabase/migrations/001_initial_schema.sql"
  "package.json"
  "vite.config.ts"
  "tsconfig.json"
  "index.html"
)

MISSING=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  ❌ Missing: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "  ✅ All ${#REQUIRED_FILES[@]} files present"
else
  echo "  ⚠️  $MISSING file(s) missing"
fi

echo ""
echo "========================================="
echo "  Health check complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. cp .env.example .env   (fill in Supabase credentials)"
echo "  2. pnpm install"
echo "  3. Run SQL in Supabase SQL Editor: supabase/migrations/001_initial_schema.sql"
echo "  4. pnpm dev"
