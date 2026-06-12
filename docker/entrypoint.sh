#!/bin/sh
set -e

mkdir -p /app/uploads /app/images
chown -R appuser:appgroup /app/uploads /app/images

exec su-exec appuser "$@"
