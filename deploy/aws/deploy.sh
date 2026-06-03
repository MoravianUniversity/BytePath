#!/bin/bash
set -e

# BytePath EC2 Deployment Script
# This script sets up the backend and frontend services on an EC2 instance

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"
BACKEND_PORT=5000
FRONTEND_PORT=5173

echo "=========================================="
echo "BytePath EC2 Deployment Script"
echo "=========================================="

# Check if running on EC2 instance
IS_EC2=false
if curl -s --max-time 2 http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    IS_EC2=true
    echo "Detected EC2 instance"
else
    echo "WARNING: This script is designed to run on an EC2 instance"
    echo "You appear to be running this on a local machine"
    echo ""
    echo "To deploy on EC2:"
    echo "  1. SSH into your EC2 instance"
    echo "  2. Clone the repository"
    echo "  3. Run: sudo bash deploy/deploy.sh"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root (needed for systemd)
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Verify project structure exists
if [ ! -d "$BACKEND_DIR" ] || [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
    echo "ERROR: Backend directory not found or incomplete"
    echo "Please ensure you've cloned the repository and are running from the project root"
    echo "Expected structure:"
    echo "  $PROJECT_ROOT/backend/requirements.txt"
    echo "  $PROJECT_ROOT/package.json"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "ERROR: Frontend directory not found or incomplete"
    echo "Please ensure you've cloned the repository and are running from the project root"
    exit 1
fi

# Auto-detect service user (ec2-user for Amazon Linux, ubuntu for Ubuntu, etc.)
if id "ec2-user" &>/dev/null; then
    SERVICE_USER="ec2-user"
elif id "ubuntu" &>/dev/null; then
    SERVICE_USER="ubuntu"
else
    # Fallback to the user who ran sudo
    SERVICE_USER="${SUDO_USER:-$(whoami)}"
    echo "Warning: Could not detect standard service user, using: $SERVICE_USER"
fi
echo "Using service user: $SERVICE_USER"

# Auto-detect EC2 public IP (allow override via environment variable)
if [ -z "$EC2_PUBLIC_IP" ]; then
    echo "Detecting EC2 public IP address..."
    
    if [ "$IS_EC2" = true ]; then
        # On EC2: Use metadata service first (most reliable)
        echo "Trying EC2 metadata service..."
        EC2_IP=$(curl -s --max-time 3 --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
        
        if [ -z "$EC2_IP" ]; then
            echo "WARNING: Could not get IP from EC2 metadata service"
            echo "This might indicate network connectivity issues or the instance doesn't have a public IP"
            echo "Trying alternative methods (requires internet access)..."
            EC2_IP=$(curl -s --max-time 5 --connect-timeout 3 https://api.ipify.org 2>/dev/null || \
                     curl -s --max-time 5 --connect-timeout 3 https://checkip.amazonaws.com 2>/dev/null || \
                     echo "")
        fi
    else
        # Not on EC2: Use public IP services (but warn user)
        echo "WARNING: Not running on EC2 - detected IP may be your local machine's IP"
        echo "Trying to detect public IP (requires internet access)..."
        EC2_IP=$(curl -s --max-time 5 --connect-timeout 3 https://api.ipify.org 2>/dev/null || \
                 curl -s --max-time 5 --connect-timeout 3 https://checkip.amazonaws.com 2>/dev/null || \
                 echo "")
        
        if [ -n "$EC2_IP" ]; then
            echo "Detected public IP: $EC2_IP"
            echo ""
            read -p "Is this your EC2 instance IP? If not, enter it now (or press Enter to use detected): " MANUAL_IP
            if [ -n "$MANUAL_IP" ]; then
                EC2_IP="$MANUAL_IP"
            fi
        fi
    fi
    
    if [ -z "$EC2_IP" ]; then
        echo ""
        echo "ERROR: Could not detect EC2 public IP address"
        echo ""
        echo "Possible causes:"
        echo "  1. No internet connectivity on EC2 instance"
        echo "  2. Security group blocking outbound HTTPS connections"
        echo "  3. Instance doesn't have a public IP address"
        echo ""
        echo "Solution: Manually set your EC2 IP address"
        echo "  1. Find your EC2 public IP in AWS Console (EC2 → Instances → Your Instance)"
        echo "  2. Run: export EC2_PUBLIC_IP=your.ip.address.here"
        echo "  3. Run: sudo -E bash deploy/deploy.sh"
        echo ""
        echo "Example:"
        echo "  export EC2_PUBLIC_IP=98.93.32.27"
        echo "  sudo -E bash deploy/deploy.sh"
        exit 1
    fi
else
    EC2_IP="$EC2_PUBLIC_IP"
    echo "Using provided EC2 IP: $EC2_IP"
fi
echo "Using EC2 public IP: $EC2_IP"

# Step 1: Install system dependencies
echo ""
echo "Step 1: Installing system dependencies..."

# Check if yum exists (Amazon Linux/RHEL)
if command -v yum &> /dev/null; then
    yum update -y
    
    # Detect Amazon Linux version and install appropriate Python
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$VERSION_ID" == "2023"* ]]; then
            echo "Detected Amazon Linux 2023 - Installing Python 3.11..."
            yum install -y python3.11 python3.11-pip python3.11-devel nodejs npm git gcc
            PYTHON_CMD="python3.11"
            PIP_CMD="pip3.11"
        else
            echo "Detected Amazon Linux 2 - Installing Python 3.11 from Amazon Linux Extras..."
            amazon-linux-extras install python3.11 -y || yum install -y python3.11 python3.11-pip python3.11-devel
            PYTHON_CMD="python3.11"
            PIP_CMD="pip3.11"
        fi
    else
        echo "Warning: Could not detect OS version, trying default python3.11..."
        yum install -y python3.11 python3.11-pip python3.11-devel nodejs npm git gcc || yum install -y python3 python3-pip nodejs npm git gcc
        if command -v python3.11 &> /dev/null; then
            PYTHON_CMD="python3.11"
            PIP_CMD="pip3.11"
        else
            PYTHON_CMD="python3"
            PIP_CMD="pip3"
        fi
    fi
elif command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    echo "Detected Ubuntu/Debian - Installing dependencies..."
    apt-get update -y
    apt-get install -y python3.11 python3.11-venv python3.11-dev nodejs npm git build-essential || \
    apt-get install -y python3 python3-venv python3-dev nodejs npm git build-essential
    if command -v python3.11 &> /dev/null; then
        PYTHON_CMD="python3.11"
        PIP_CMD="pip3.11"
    else
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    fi
else
    echo "ERROR: This script requires Amazon Linux, RHEL, or Ubuntu"
    echo "Detected system does not have yum or apt-get"
    echo "Please run this script on an EC2 instance with Amazon Linux or Ubuntu"
    exit 1
fi

# Verify Python version (must be 3.10+)
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo "Using Python version: $PYTHON_VERSION"
if ! $PYTHON_CMD -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"; then
    echo "ERROR: Python 3.10+ is required, but found $PYTHON_VERSION"
    echo "Please install Python 3.10 or higher manually"
    exit 1
fi

# Step 2: Setup backend
echo ""
echo "Step 2: Setting up backend..."
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist (using detected Python version)
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment with $PYTHON_CMD..."
    $PYTHON_CMD -m venv .venv
fi

# Activate venv and install dependencies
source .venv/bin/activate
pip install --upgrade pip
echo "Installing Python dependencies (this may take a minute)..."
pip install -r requirements.txt
# Ensure gunicorn is installed (in case it's not in requirements.txt)
pip install gunicorn || true

# Ensure database directory exists
mkdir -p "$BACKEND_DIR"
touch "$BACKEND_DIR/bytepath.db"
chown -R $SERVICE_USER:$SERVICE_USER "$BACKEND_DIR"

# Initialize database if it doesn't exist or is empty
if [ ! -s "$BACKEND_DIR/bytepath.db" ]; then
    echo "Initializing database..."
    cd "$PROJECT_ROOT"
    export PYTHONPATH="$PROJECT_ROOT"
    source "$BACKEND_DIR/.venv/bin/activate"
    python3 -m backend.init_db || echo "Warning: Database initialization may have failed"
    
    # Run db_migration script to ensure schema is up to date
    if [ -f "$PROJECT_ROOT/backend/db_migration.py" ]; then
        echo "Updating database schema..."
        python3 -m backend.db_migration || echo "Warning: Schema update may have failed"
    fi
    chown $SERVICE_USER:$SERVICE_USER "$BACKEND_DIR/bytepath.db"
else
    echo "Database already exists, skipping initialization..."
    # Still run db_migration to ensure schema is up to date
    if [ -f "$PROJECT_ROOT/backend/db_migration.py" ]; then
        echo "Checking database schema..."
        cd "$PROJECT_ROOT"
        export PYTHONPATH="$PROJECT_ROOT"
        source "$BACKEND_DIR/.venv/bin/activate"
        python3 -m backend.db_migration || echo "Warning: Schema update may have failed"
    fi
fi

# Step 3: Setup frontend
echo ""
echo "Step 3: Setting up frontend..."
cd "$FRONTEND_DIR"

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Install serve globally for serving built frontend
if ! command -v serve &> /dev/null; then
    echo "Installing serve package..."
    npm install -g serve
fi

# Build frontend
echo "Building frontend..."
# Use detected EC2 public IP for API base URL
export VITE_API_BASE="http://$EC2_IP:$BACKEND_PORT/api"
echo "Setting VITE_API_BASE to http://$EC2_IP:$BACKEND_PORT/api"
npm run build

# Create frontend service directory
FRONTEND_SERVE_DIR="$FRONTEND_DIR/dist"
chown -R $SERVICE_USER:$SERVICE_USER "$FRONTEND_DIR"

# Step 4: Create/update environment file
echo ""
echo "Step 4: Setting up environment variables..."
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    SECRET_KEY=$(openssl rand -hex 32)
    cat > "$ENV_FILE" << EOF
# BytePath Production Environment Variables
FLASK_ENV=production
BYTEPATH_SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=http://localhost:5173,http://$EC2_IP:5173,http://$EC2_IP:$FRONTEND_PORT
EOF
    chown $SERVICE_USER:$SERVICE_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Created .env file at $ENV_FILE"
    echo "IMPORTANT: Review and update BYTEPATH_SECRET_KEY if needed"
else
    echo ".env file already exists, updating CORS_ORIGINS..."
    # Preserve existing SECRET_KEY if it exists
    if grep -q "BYTEPATH_SECRET_KEY=" "$ENV_FILE"; then
        SECRET_KEY=$(grep "BYTEPATH_SECRET_KEY=" "$ENV_FILE" | cut -d'=' -f2-)
    else
        SECRET_KEY=$(openssl rand -hex 32)
    fi
    # Update or add CORS_ORIGINS
    if grep -q "CORS_ORIGINS=" "$ENV_FILE"; then
        # Update existing CORS_ORIGINS line
        sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost:5173,http://$EC2_IP:5173,http://$EC2_IP:$FRONTEND_PORT|" "$ENV_FILE"
    else
        # Add CORS_ORIGINS if it doesn't exist
        echo "CORS_ORIGINS=http://localhost:5173,http://$EC2_IP:5173,http://$EC2_IP:$FRONTEND_PORT" >> "$ENV_FILE"
    fi
    # Ensure SECRET_KEY exists
    if ! grep -q "BYTEPATH_SECRET_KEY=" "$ENV_FILE"; then
        echo "BYTEPATH_SECRET_KEY=$SECRET_KEY" >> "$ENV_FILE"
    fi
    chown $SERVICE_USER:$SERVICE_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Updated .env file with new CORS_ORIGINS"
fi

# Step 5: Create systemd service files
echo ""
echo "Step 5: Creating systemd service files..."

# Backend service - determine Python path in venv
PYTHON_VENV_PATH="$BACKEND_DIR/.venv/bin/$PYTHON_CMD"
if [ ! -f "$PYTHON_VENV_PATH" ]; then
    # Fallback to python3 in venv
    PYTHON_VENV_PATH="$BACKEND_DIR/.venv/bin/python3"
fi

cat > /etc/systemd/system/bytepath-backend.service << EOF
[Unit]
Description=BytePath Backend API (Gunicorn)
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$PROJECT_ROOT
Environment="PATH=$BACKEND_DIR/.venv/bin"
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$PYTHON_VENV_PATH -m gunicorn \
    --bind 0.0.0.0:$BACKEND_PORT \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --pythonpath $PROJECT_ROOT \
    backend.app:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend service - find serve binary
SERVE_BIN=$(which serve 2>/dev/null || echo "/usr/bin/serve")
if [ ! -f "$SERVE_BIN" ]; then
    # Try common locations
    if [ -f "/usr/local/bin/serve" ]; then
        SERVE_BIN="/usr/local/bin/serve"
    elif [ -f "$HOME/.npm-global/bin/serve" ]; then
        SERVE_BIN="$HOME/.npm-global/bin/serve"
    else
        echo "ERROR: Could not find 'serve' binary. Please install it with: npm install -g serve"
        exit 1
    fi
fi
echo "Using serve binary: $SERVE_BIN"

cat > /etc/systemd/system/bytepath-frontend.service << EOF
[Unit]
Description=BytePath Frontend (Static Server)
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$FRONTEND_SERVE_DIR
ExecStart=$SERVE_BIN -s . -l $FRONTEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 6: Update CORS configuration for production
echo ""
echo "Step 6: Updating CORS configuration..."
# Note: This will be handled by environment variable or config update
# We'll update the config to read from environment

# Step 7: Configure firewall (if firewalld is running)
echo ""
echo "Step 7: Configuring firewall..."
if systemctl is-active --quiet firewalld; then
    echo "Opening ports $BACKEND_PORT and $FRONTEND_PORT..."
    firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
    firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp
    firewall-cmd --reload
    echo "Firewall configured"
else
    echo "Firewalld not running, skipping firewall configuration"
fi

# Step 8: Reload systemd and enable services
echo ""
echo "Step 8: Enabling and starting services..."
systemctl daemon-reload
systemctl enable bytepath-backend
systemctl enable bytepath-frontend

# Stop services if they're already running
systemctl stop bytepath-backend bytepath-frontend 2>/dev/null || true
sleep 2

# Start services
echo "Starting backend service..."
if systemctl start bytepath-backend; then
    echo "Backend service started"
else
    echo "ERROR: Failed to start backend service"
    echo "Check logs with: sudo journalctl -u bytepath-backend -n 50"
    exit 1
fi

echo "Starting frontend service..."
if systemctl start bytepath-frontend; then
    echo "Frontend service started"
else
    echo "ERROR: Failed to start frontend service"
    echo "Check logs with: sudo journalctl -u bytepath-frontend -n 50"
    exit 1
fi

# Wait a moment for services to fully start
sleep 3

# Check service status
if ! systemctl is-active --quiet bytepath-backend; then
    echo "WARNING: Backend service is not running"
    echo "Check logs: sudo journalctl -u bytepath-backend -n 50"
fi

if ! systemctl is-active --quiet bytepath-frontend; then
    echo "WARNING: Frontend service is not running"
    echo "Check logs: sudo journalctl -u bytepath-frontend -n 50"
fi

# Step 9: Show status
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Service Status:"
systemctl status bytepath-backend --no-pager -l || true
echo ""
systemctl status bytepath-frontend --no-pager -l || true
echo ""
echo "Services are running on:"
echo "  Backend:  http://$EC2_IP:$BACKEND_PORT"
echo "  Frontend: http://$EC2_IP:$FRONTEND_PORT"
echo ""
echo "Useful commands:"
echo "  Check backend logs:  sudo journalctl -u bytepath-backend -f"
echo "  Check frontend logs: sudo journalctl -u bytepath-frontend -f"
echo "  Restart backend:     sudo systemctl restart bytepath-backend"
echo "  Restart frontend:    sudo systemctl restart bytepath-frontend"
echo "  Stop services:       sudo systemctl stop bytepath-backend bytepath-frontend"
echo ""

