Semi-Manual Deployment
====================== 

For the original automated local and AWS EC2 deployments, see the aws folder.

Prerequisites
-------------
Install and setup nginx using either self-signed certificates (if using something like CloudFlare proxy) or Let's Encrypt (if using a domain name directly pointing to the server).

Make sure `npm` and `python3` are installed on the server.

Setup Repository
----------------
```bash
sudo useradd -m bytepath
sudo su -l bytepath
git clone https://github.com/MoravianUniversity/BytePath.git
cd BytePath
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt
npm install
if [ ! -f "$BACKEND_DIR/bytepath.db" ]; then
    python3 -m backend.init_db
fi
```

Create .env
-----------
Setup your Google OAuth credentials and download the client secrets JSON file from the Google Cloud Console to the backend/credentials directory. Then complete the `.env` file in the root of the project with the following content, replacing the values as necessary (mainly the URLs and the Google Client information):

```env
FLASK_RUN_PORT=5005
FLASK_DEBUG=0
VITE_API_BASE=https://bytepath.moravian.dev/api
CORS_ORIGINS=https://bytepath.moravian.dev
FRONTEND_URL=https://bytepath.moravian.dev

BYTEPATH_SECRET_KEY=...
FLASK_ENV=production

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRETS_FILE="backend/credentials/client_secret_....json"
GOOGLE_REDIRECT_URI=https://bytepath.moravian.dev/api/auth/google/callback
GOOGLE_OAUTH_SCOPE="https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid"
```

Create NGINX Configuration
--------------------------
Create the following nginx configuration file (e.g., `/etc/nginx/conf.d/bytepath.conf`, update the server_name and SSL certificate paths as necessary):

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name bytepath.moravian.dev;
    root /home/web;
    ssl_certificate /etc/nginx/self-signed.crt;
    ssl_certificate_key /etc/nginx/self-signed.key;
    gzip_static on;

    location /api {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_http_version 1.1;
        proxy_redirect off;
        proxy_pass http://localhost:5005/api;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_http_version 1.1;
        proxy_redirect off;
        proxy_pass http://localhost:5173/;
    }
}
```

Create Systemd Services
-----------------------
Run the create-services.sh script (look at the script for details if not using the standard username or paths).

Updating
--------
To update the application, pull the latest changes from the repository, install any new dependencies, and restart the services:

```bash
sudo su -l bytepath
cd BytePath
source .venv/bin/activate
git pull
pip install -r backend/requirements.txt
npm install
python3 -m backend.db_migration
sudo systemctl restart bytepath-backend
sudo systemctl restart bytepath-frontend
```
