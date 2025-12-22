#!/bin/bash
# Infrastructure Verification Script
# Run this to verify all containers and networks are configured correctly

set -e

RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

echo -e "${BLUE}=== HealthScribe Infrastructure Verification ===${RESET}\n"

# Counter for checks
PASS=0
FAIL=0

check_pass() {
    echo -e "${GREEN}✓${RESET} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${RESET} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${RESET} $1"
}

# 1. Check Containers
echo -e "${BLUE}1. CONTAINER STATUS${RESET}"
echo "Checking if all required containers are running..."

containers=("medical-transcription-app" "medical-transcription-postgres" "medical-transcription-redis" "medical-transcription-n8n-db" "supabase-db" "supabase-rest" "supabase-kong" "supabase-auth" "supabase-storage")

for container in "${containers[@]}"; do
    if docker ps | grep -q "$container"; then
        check_pass "Container '$container' is running"
    else
        check_fail "Container '$container' is NOT running"
    fi
done

echo ""

# 2. Check Networks
echo -e "${BLUE}2. NETWORK CONFIGURATION${RESET}"
echo "Verifying Docker networks..."

networks=("app_medical-transcription" "healthscribe_web" "supabase_default" "supabase_network_supabase" "traefik-proxy")

for network in "${networks[@]}"; do
    if docker network ls | grep -q "$network"; then
        check_pass "Network '$network' exists"
    else
        check_fail "Network '$network' does NOT exist"
    fi
done

echo ""

# 3. Check App Container Network Connections
echo -e "${BLUE}3. APP CONTAINER NETWORK CONNECTIONS${RESET}"
echo "Verifying app is on required networks..."

if docker inspect medical-transcription-app | grep -q '"app_medical-transcription"'; then
    check_pass "App is on 'app_medical-transcription' network"
else
    check_fail "App is NOT on 'app_medical-transcription' network"
fi

if docker inspect medical-transcription-app | grep -q '"healthscribe_web"'; then
    check_pass "App is on 'healthscribe_web' network"
else
    check_fail "App is NOT on 'healthscribe_web' network - CRITICAL FOR UPLOADS"
fi

echo ""

# 4. Check Hostname Resolution
echo -e "${BLUE}4. HOSTNAME RESOLUTION (inside app container)${RESET}"
echo "Testing DNS resolution from app container..."

hostnames=("supabase-kong" "medical-transcription-redis" "medical-transcription-postgres" "supabase-auth" "supabase-storage")

for hostname in "${hostnames[@]}"; do
    if docker exec medical-transcription-app nslookup "$hostname" 2>/dev/null | grep -q "Address"; then
        check_pass "Hostname '$hostname' resolves correctly"
    else
        check_fail "Hostname '$hostname' CANNOT resolve"
    fi
done

echo ""

# 5. Check Container Health
echo -e "${BLUE}5. CONTAINER HEALTH STATUS${RESET}"
echo "Checking health checks where applicable..."

healthy_containers=("supabase-kong" "supabase-auth" "supabase-storage" "supabase-db" "medical-transcription-n8n-db")

for container in "${healthy_containers[@]}"; do
    status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{print $NF}')
    if [[ "$status" == *"healthy"* ]]; then
        check_pass "Container '$container' is healthy"
    elif [[ "$status" == *"Up"* ]]; then
        check_warn "Container '$container' is up but health check status unknown"
    else
        check_fail "Container '$container' is NOT healthy"
    fi
done

echo ""

# 6. Check Supabase Kong Network Configuration
echo -e "${BLUE}6. SUPABASE-KONG NETWORK CONFIGURATION${RESET}"
echo "Verifying supabase-kong is on all required networks..."

if docker inspect supabase-kong | grep -q '"healthscribe_web"'; then
    check_pass "supabase-kong is on 'healthscribe_web' network"
else
    check_fail "supabase-kong is NOT on 'healthscribe_web' network"
fi

if docker inspect supabase-kong | grep -q '"supabase_default"'; then
    check_pass "supabase-kong is on 'supabase_default' network"
else
    check_fail "supabase-kong is NOT on 'supabase_default' network"
fi

if docker inspect supabase-kong | grep -q '"traefik-proxy"'; then
    check_pass "supabase-kong is on 'traefik-proxy' network"
else
    check_fail "supabase-kong is NOT on 'traefik-proxy' network"
fi

echo ""

# 7. Check Recent Upload Success
echo -e "${BLUE}7. RECENT UPLOAD STATUS${RESET}"
echo "Checking app logs for recent successful uploads..."

if docker logs medical-transcription-app 2>&1 | tail -100 | grep -q "Audio uploaded successfully"; then
    check_pass "Recent successful audio uploads detected"
else
    check_warn "No recent successful uploads in logs"
fi

if docker logs medical-transcription-app 2>&1 | tail -50 | grep -q "getaddrinfo EAI_AGAIN"; then
    check_fail "DNS resolution errors detected (supabase-kong unreachable)"
else
    check_pass "No DNS resolution errors detected"
fi

echo ""

# 8. Check Volume Mounts
echo -e "${BLUE}8. DATA VOLUMES${RESET}"
echo "Verifying critical data volumes exist..."

volumes=("app_postgres_data" "app_redis_data" "healthscribe_n8n-db-data")

for volume in "${volumes[@]}"; do
    if docker volume ls | grep -q "$volume"; then
        check_pass "Volume '$volume' exists"
    else
        check_fail "Volume '$volume' does NOT exist - data may be lost on restart"
    fi
done

echo ""

# 9. Check Website Accessibility
echo -e "${BLUE}9. WEBSITE ACCESSIBILITY${RESET}"
echo "Testing if website is responding..."

if curl -s -m 5 http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
    check_pass "App API health endpoint is responding"
else
    check_fail "App API health endpoint is NOT responding"
fi

if curl -s -m 5 -k https://localhost/ > /dev/null 2>&1; then
    check_pass "Website is accessible via HTTPS"
else
    check_fail "Website is NOT accessible via HTTPS"
fi

echo ""

# Summary
echo -e "${BLUE}=== VERIFICATION SUMMARY ===${RESET}"
echo -e "Passed: ${GREEN}${PASS}${RESET}"
echo -e "Failed: ${RED}${FAIL}${RESET}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓ All checks passed! Infrastructure is properly configured.${RESET}"
    exit 0
else
    echo -e "\n${RED}✗ Some checks failed. Please review the output above.${RESET}"
    echo ""
    echo "Common fixes:"
    echo "1. If app is missing 'healthscribe_web' network:"
    echo "   docker network connect healthscribe_web medical-transcription-app"
    echo "   docker restart medical-transcription-app"
    echo ""
    echo "2. If containers aren't running:"
    echo "   docker start <container_name>"
    echo ""
    echo "3. For more details, check INFRASTRUCTURE-CONFIG.md"
    exit 1
fi
