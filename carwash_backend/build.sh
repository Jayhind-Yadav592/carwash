#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "===> Upgrading pip and installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "===> Collecting static files..."
python manage.py collectstatic --noinput

echo "===> Running database migrations..."
python manage.py migrate

echo "===> Build script completed successfully!"