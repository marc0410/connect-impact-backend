#!/bin/sh
set -e

echo "Running Prisma migrations..."
prisma migrate deploy

echo "Starting application..."
exec node dist/main
