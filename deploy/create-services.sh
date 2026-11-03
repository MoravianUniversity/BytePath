BP_USER=bytepath
BP_DIR=/home/$BP_USER/BytePath

# Resolve npm from the service user's nvm install (Vite 8 needs Node 20.19+ / 24+)
NPM_BIN=$(sudo -u "$BP_USER" bash -lc 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; command -v npm')
if [ -z "$NPM_BIN" ] || [ ! -x "$NPM_BIN" ]; then
  echo "ERROR: npm not found via nvm for user $BP_USER. Install Node 24 with nvm first (see deploy/README.md)." >&2
  exit 1
fi
NODE_BIN_DIR=$(dirname "$NPM_BIN")

sudo tee /etc/systemd/system/bytepath-backend.service > /dev/null <<EOL
[Unit]
Description=Bytepath Backend Service
After=network.target

[Service]
ExecStart=$BP_DIR/backend/.venv/bin/python3 -m backend.app
WorkingDirectory=$BP_DIR
User=$BP_USER
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOL

sudo tee /etc/systemd/system/bytepath-frontend.service > /dev/null <<EOL
[Unit]
Description=Bytepath Frontend Service
After=network.target

[Service]
Environment=PATH=$NODE_BIN_DIR:/usr/bin:/bin
ExecStart=$NPM_BIN run dev
WorkingDirectory=$BP_DIR
User=$BP_USER
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl daemon-reload
sudo systemctl enable --now bytepath-backend
sudo systemctl enable --now bytepath-frontend
