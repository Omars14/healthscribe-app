#!/bin/bash
# Update server .env with SUPABASE_INTERNAL_URL

APP_DIR=/opt/healthscribe/dashboard-next
ENV_FILE=$APP_DIR/.env.local

if [ -f $ENV_FILE ]; then
  if ! grep -q "SUPABASE_INTERNAL_URL" $ENV_FILE; then
    echo "SUPABASE_INTERNAL_URL=http://supabase-auth:9999" >> $ENV_FILE
    echo "✓ Added SUPABASE_INTERNAL_URL to .env.local"
  else
    echo "✓ SUPABASE_INTERNAL_URL already in .env.local"
  fi
else
  echo "SUPABASE_INTERNAL_URL=http://supabase-auth:9999" > $ENV_FILE
  echo "✓ Created .env.local with SUPABASE_INTERNAL_URL"
fi

tail -n 3 $ENV_FILE
