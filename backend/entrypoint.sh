#!/bin/sh
set -e

# Initialize migrations if not present
if [ ! -d "/app/migrations" ]; then
  echo "Initializing migrations..."
  flask db init
fi

# Generate initial migration if no version files exist
if [ -z "$(ls /app/migrations/versions/*.py 2>/dev/null)" ]; then
  echo "Generating initial migration..."
  flask db migrate -m "initial schema"
fi

echo "Running migrations..."
flask db upgrade

echo "Seeding TTPs..."
python seeds/ttp_seed.py

echo "Starting Flask..."
exec flask run --host=0.0.0.0 --port=5000
