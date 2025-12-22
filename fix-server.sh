#!/bin/bash
# Fix syntax error and rebuild

FILE="/root/healthscribe-build/src/app/dashboard/transcriptionist-workspace.tsx"

echo "Fixing syntax error on line 1138..."

# Use Python to fix the line safely
python3 << 'EOF'
file_path = "/root/healthscribe-build/src/app/dashboard/transcriptionist-workspace.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# Fix line 1138 (0-indexed: 1137)
if len(lines) > 1137:
    old_line = lines[1137]
    print(f"Old line: {repr(old_line)}")
    # Fix the syntax error
    new_line = '                          onError={(e) => console.error("Audio load error", e)}\n'
    lines[1137] = new_line
    print(f"New line: {repr(new_line)}")
    
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Fixed!")
else:
    print("Line not found")
EOF

echo ""
echo "Rebuilding..."
cd /root/healthscribe-build
npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
    echo ""
    echo "Build successful! Restarting container..."
    docker stop medical-transcription-app 2>/dev/null || true
    docker rm medical-transcription-app 2>/dev/null || true
    
    docker run -d \
      --name medical-transcription-app \
      --restart unless-stopped \
      -p 3000:3000 \
      -v /root/healthscribe-build/.next/standalone:/app \
      -v /root/healthscribe-build/.next/static:/app/.next/static \
      -v /root/healthscribe-build/public:/app/public \
      --env-file /root/healthscribe-build/.env.local \
      node:20-alpine \
      sh -c "cd /app && node server.js"
    
    echo ""
    echo "Container restarted. Checking status..."
    sleep 3
    docker ps | grep medical-transcription-app
    echo ""
    echo "Done! Real-time updates should now work."
else
    echo "Build failed!"
fi
