import os
import re
import time
import subprocess
import requests

DIR = '/root/supermarket_dostavka'
ENV_FILE = os.path.join(DIR, 'backend/.env')
BOT_TOKEN = '9269373281:AAE4aSj2emUTbykUn3HvuAE3Z2uqikdo_mk'

# Use high-performance, official SSL domain on server (no iOS Webview / ATS blocking!)
APP_URL = 'https://tensoric.space/dostavka/'
print(f'✅ Primary Secure URL (SSL): {APP_URL}')

# Update .env
env_content = f"""BOT_TOKEN={BOT_TOKEN}
DATABASE_URL=sqlite+aiosqlite:///./korzinka_delivery.db
MINI_APP_URL={APP_URL}
HOST=0.0.0.0
PORT=8000
ADMIN_USERNAMES=Software_engineerings
ADMIN_TELEGRAM_IDS=
"""
with open(ENV_FILE, 'w') as f:
    f.write(env_content)
print('✅ Updated backend/.env')

# Update Telegram Chat Menu Button
try:
    r = requests.post(
        f'https://api.telegram.org/bot{BOT_TOKEN}/setChatMenuButton',
        json={
            'menu_button': {
                'type': 'web_app',
                'text': "🛒 Do'kon",
                'web_app': {'url': APP_URL}
            }
        },
        timeout=10
    )
    print('✅ Telegram Menu Button updated:', r.json())
except Exception as e:
    print('Warning updating menu button:', e)

print('Starting FastAPI backend & Telegram Bot on port 8000...')
backend_proc = subprocess.Popen(
    [os.path.join(DIR, 'venv/bin/python3'), os.path.join(DIR, 'backend/app/main.py')],
    cwd=DIR,
    env=dict(os.environ, PYTHONPATH=os.path.join(DIR, 'backend'))
)

try:
    backend_proc.wait()
except KeyboardInterrupt:
    backend_proc.terminate()
