#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Upgrade pip to ensure seamless package installation
pip install --upgrade pip

# 2. Force install packages explicitly to bypass any caching bugs
pip install whitenoise gunicorn dj-database-url psycopg2-binary

# 3. Fallback dependency installation
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi

# 4. Print installed packages to logs so we can verify the installation
pip list

# 5. Run Django tasks
python manage.py collectstatic --noinput
python manage.py migrate

# Inside build.sh
cd Frontend          # <-- Make sure this is lowercase 'frontend'
npm install
npm run build
cd ..
