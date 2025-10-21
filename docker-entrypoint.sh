#!/bin/sh
set -e

# Force the server to listen on all interfaces
export HOSTNAME=0.0.0.0

# Run the Next.js server
exec node server.js
