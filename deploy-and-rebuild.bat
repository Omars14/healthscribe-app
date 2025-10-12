@echo off
echo ========================================
echo DEPLOYING AND REBUILDING APPLICATION
echo ========================================
echo.

echo 1. Creating deployment archive...
tar -czf dashboard-deploy.tar.gz ^
  --exclude=node_modules ^
  --exclude=.next ^
  --exclude=.git ^
  --exclude=*.tar.gz ^
  src package.json package-lock.json Dockerfile next.config.ts tsconfig.json postcss.config.js tailwind.config.ts components.json public

echo.
echo 2. Uploading to VPS...
pscp -pw Nomar123 dashboard-deploy.tar.gz root@154.26.155.207:/root/

echo.
echo 3. Building on VPS...
plink -pw Nomar123 root@154.26.155.207 "cd /root && tar -xzf dashboard-deploy.tar.gz -C /root/dashboard-build/ && cd /root/dashboard-build && export $(cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | grep -v '^#' | xargs) && docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=\"$NEXT_PUBLIC_SUPABASE_URL\" --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=\"$NEXT_PUBLIC_SUPABASE_ANON_KEY\" --build-arg SUPABASE_SERVICE_ROLE_KEY=\"$SUPABASE_SERVICE_ROLE_KEY\" --build-arg N8N_WEBHOOK_URL=\"$N8N_WEBHOOK_URL\" --no-cache -t healthscribe-fresh:latest . && cd /data/coolify/applications/tkwoos4soccckws84088wc04 && sed -i \"s|healthscribe-final|healthscribe-fresh|g\" docker-compose.yaml && docker compose down && docker compose up -d"

echo.
echo ========================================
echo REBUILD COMPLETE!
echo ========================================
echo.
echo Now test in incognito mode!
pause

