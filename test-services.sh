#!/bin/bash
echo '=== SERVICE STATUS TEST ==='
echo ''

echo '1. Auth Service Health (/auth/v1/health):'
curl -s -k https://healthscribe.pro/auth/v1/health
echo ''

echo '2. Auth Service Root Health (/auth/health):'
curl -s -k https://healthscribe.pro/auth/health
echo ''

echo '3. REST API Status (/rest/):'
curl -s -k https://healthscribe.pro/rest/
echo ''

echo '4. Main Site Status:'
curl -s -k https://healthscribe.pro | head -2
echo ''

echo '=== PROCESS STATUS ==='
pm2 status
echo ''

echo '=== DOCKER STATUS ==='
sudo docker ps
echo ''

echo '=== PORT USAGE ==='
sudo netstat -tulpn | grep -E '(3000|3001|9999)'


