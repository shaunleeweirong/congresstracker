#!/bin/bash

# Deployment Verification Script
# Verifies that your production deployment is working correctly

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Production Deployment..."
echo "======================================"

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Installing recommended for JSON parsing.${NC}"
    echo "   Install: brew install jq (macOS) or apt install jq (Linux)"
fi

# Get URLs from user
echo ""
read -p "Enter your backend URL (e.g., https://congresstracker-backend.onrender.com): " BACKEND_URL
read -p "Enter your frontend URL (e.g., https://congresstracker.vercel.app): " FRONTEND_URL

# Remove trailing slashes
BACKEND_URL=${BACKEND_URL%/}
FRONTEND_URL=${FRONTEND_URL%/}

echo ""
echo "Testing endpoints..."
echo "==================="

# Test 1: Backend Health
echo -n "1. Backend health check... "
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $HEALTH_RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $HEALTH_RESPONSE)"
    echo "   Expected: 200, Got: $HEALTH_RESPONSE"
fi

# Test 2: API Info
echo -n "2. API information endpoint... "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1")
if [ "$API_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $API_RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $API_RESPONSE)"
    echo "   Expected: 200, Got: $API_RESPONSE"
fi

# Test 3: Trades Endpoint
echo -n "3. Trades endpoint... "
TRADES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/trades?limit=5")
if [ "$TRADES_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $TRADES_RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $TRADES_RESPONSE)"
    echo "   Expected: 200, Got: $TRADES_RESPONSE"
fi

# Test 4: Search Endpoint
echo -n "4. Search endpoint... "
SEARCH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/search?q=Nancy&type=all&limit=5")
if [ "$SEARCH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $SEARCH_RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $SEARCH_RESPONSE)"
    echo "   Expected: 200, Got: $SEARCH_RESPONSE"
fi

# Test 5: Frontend
echo -n "5. Frontend accessibility... "
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $FRONTEND_RESPONSE)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $FRONTEND_RESPONSE)"
    echo "   Expected: 200, Got: $FRONTEND_RESPONSE"
fi

# Test 6: CORS Headers
echo -n "6. CORS configuration... "
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -I "$BACKEND_URL/api/v1" | grep -i "access-control-allow-origin" || echo "")
if [ ! -z "$CORS_RESPONSE" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   $CORS_RESPONSE"
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "   CORS headers not found. Check CORS_ORIGIN in backend env vars."
fi

# Test 7: SSL/HTTPS
echo -n "7. SSL/HTTPS enabled... "
if [[ $BACKEND_URL == https://* ]] && [[ $FRONTEND_URL == https://* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Both URLs should use HTTPS"
fi

# Summary
echo ""
echo "======================================"
echo "📊 Deployment Verification Summary"
echo "======================================"
echo ""
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Next steps:"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Check browser console (F12) for any errors"
echo "3. Test key features:"
echo "   - Dashboard loads"
echo "   - Trades display"
echo "   - Search works"
echo "   - Stock pages load"
echo "   - Dark mode toggles"
echo ""
echo "📚 Full deployment guide: docs/DEPLOYMENT.md"
echo "✅ Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🎉 If all tests passed, your deployment is ready!"
