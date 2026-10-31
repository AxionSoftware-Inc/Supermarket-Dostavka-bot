import os
import re
import time
import subprocess
import requests

DIR = '/root/supermarket_dostavka'
ENV_FILE = os.path.join(DIR, 'backend/.env')
LOG_FILE = os.path.join(DIR, 'tunnel.log')
BOT_TOKEN = '9269373281:AAE4aSj2emUTbykUn3HvuAE3Z2uqikdo_mk'

print('1. Stopping any existing cloudflared tunnel...')
subprocess.run(['pkill', '-f', 'cloudflared tunnel'], check=False)
time.sleep(1)

print('2. Starting cloudflared tunnel on port 8000...')
if os.path.exists(LOG_FILE):
    os.remove(LOG_FILE)

log_fp = open(LOG_FILE, 'w')
proc = subprocess.Popen(
    ['/usr/local/bin/cloudflared', 'tunnel', '--url', 'http://127.0.0.1:8000'],
    stdout=log_fp,
    stderr=subprocess.STDOUT
)

print('3. Waiting for tunnel URL...')
tunnel_url = None
for _ in range(35):
    time.sleep(1)
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            content = f.read()
            match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', content)
            if match:
                tunnel_url = match.group(0)
                break

if not tunnel_url:
    print('Failed to get tunnel URL')
    exit(1)

print(f'✅ Public Tunnel URL: {tunnel_url}')

# Update .env
env_content = f"""BOT_TOKEN={BOT_TOKEN}
DATABASE_URL=sqlite+aiosqlite:///./korzinka_delivery.db
MINI_APP_URL={tunnel_url}
HOST=0.0.0.0
PORT=8000
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
                'web_app': {'url': tunnel_url}
            }
        },
        timeout=10
    )
    print('✅ Telegram Menu Button updated:', r.json())
except Exception as e:
    print('Warning updating menu button:', e)

print('Starting FastAPI backend & Telegram Bot...')
backend_proc = subprocess.Popen(
    [os.path.join(DIR, 'venv/bin/python3'), os.path.join(DIR, 'backend/app/main.py')],
    cwd=DIR,
    env=dict(os.environ, PYTHONPATH=os.path.join(DIR, 'backend'))
)

try:
    backend_proc.wait()
except KeyboardInterrupt:
    proc.terminate()
    backend_proc.terminate()
