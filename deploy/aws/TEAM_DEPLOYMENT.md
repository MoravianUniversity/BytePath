# Team Deployment Guide

This guide is for team members who want to deploy BytePath on their own EC2 instances.

## Prerequisites

- An AWS EC2 instance running Amazon Linux 2 or 2023 (or Ubuntu)
- SSH access to your EC2 instance
- Your EC2 instance's public IP address

## Step-by-Step Deployment

### Step 1: Launch Your EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Amazon Linux 2023** or **Amazon Linux 2** AMI
3. Select instance type (t2.micro is fine for testing)
4. Configure security group:
   - **Port 22** (SSH) - from your IP
   - **Port 5000** (Backend API) - from anywhere (0.0.0.0/0) or your IP
   - **Port 5173** (Frontend) - from anywhere (0.0.0.0/0) or your IP
5. Launch instance and download your key pair (.pem file)

### Step 2: SSH Into Your EC2 Instance

```bash
# Replace with your key file and IP
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

**Note:** If you're on Windows, use WSL, Git Bash, or PuTTY.

### Step 3: Clone the Repository

```bash
# Install git if needed
sudo yum install -y git

# Clone the repository
cd ~
git clone https://github.com/cs298f25/Deborah-Marena-Matt-Vicente.git
cd Deborah-Marena-Matt-Vicente
```

### Step 4: Run the Deployment Script

```bash
# Run the automated deployment script
sudo bash deploy/deploy.sh
```

**What the script does automatically:**
- ✅ Detects your EC2 instance IP address
- ✅ Detects your service user (ec2-user or ubuntu)
- ✅ Installs Python 3.11, Node.js, and dependencies
- ✅ Sets up backend virtual environment
- ✅ Initializes and updates database schema
- ✅ Builds frontend with correct API URL
- ✅ Creates systemd services
- ✅ Configures firewall
- ✅ Starts backend and frontend services

**The script will:**
- Auto-detect your EC2 public IP (no manual configuration needed!)
- Show you the URLs at the end: `http://YOUR_IP:5173` and `http://YOUR_IP:5000`

### Step 5: Verify Deployment

After the script completes, check if services are running:

```bash
# Check service status
sudo systemctl status bytepath-backend
sudo systemctl status bytepath-frontend

# Or use the diagnostic script
bash deploy/check_deployment.sh
```

### Step 6: Access Your Application

Open your browser and go to:
- **Frontend:** `http://YOUR_EC2_IP:5173`
- **Backend API:** `http://YOUR_EC2_IP:5000/api`

Replace `YOUR_EC2_IP` with the IP address shown by the deployment script.

## Troubleshooting

### If the script fails to detect your IP:

```bash
# Manually set your EC2 IP
export EC2_PUBLIC_IP=your.instance.ip.address
sudo -E bash deploy/deploy.sh
```

### If services won't start:

```bash
# Check logs
sudo journalctl -u bytepath-backend -n 50
sudo journalctl -u bytepath-frontend -n 50

# Restart services
sudo systemctl restart bytepath-backend bytepath-frontend
```

### If you can't access from browser:

1. **Check Security Group:**
   - Go to AWS Console → EC2 → Security Groups
   - Ensure ports 5000 and 5173 are open (inbound rules)

2. **Check if services are running:**
   ```bash
   sudo systemctl status bytepath-backend bytepath-frontend
   ```

3. **Test locally on EC2:**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Common Issues

**"yum: command not found"**
- You're running the script locally, not on EC2
- SSH into your EC2 instance first

**"Port already in use"**
- Stop existing services: `sudo systemctl stop bytepath-backend bytepath-frontend`
- Or kill the process: `sudo lsof -ti:5000 | xargs kill`

**"Permission denied"**
- Make sure you're using `sudo`: `sudo bash deploy/deploy.sh`

**"Database errors"**
- The script automatically initializes the database
- If it fails, manually run: `python3 -m backend.db_migration`

## Useful Commands

```bash
# View service logs
sudo journalctl -u bytepath-backend -f
sudo journalctl -u bytepath-frontend -f

# Restart services
sudo systemctl restart bytepath-backend bytepath-frontend

# Stop services
sudo systemctl stop bytepath-backend bytepath-frontend

# Check service status
sudo systemctl status bytepath-backend bytepath-frontend

# Run diagnostic check
bash deploy/check_deployment.sh
```

## Updating After Code Changes

If you pull new changes from GitHub:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Pull latest changes
cd ~/Deborah-Marena-Matt-Vicente
git pull

# Rebuild and restart
cd backend
source .venv/bin/activate
pip install -r requirements.txt  # If requirements changed
cd ..
export VITE_API_BASE=http://YOUR_EC2_IP:5000/api
npm run build
sudo systemctl restart bytepath-backend bytepath-frontend
```

## Notes

- Each team member will have their own EC2 IP address
- The script automatically detects and configures everything for your instance
- No manual IP editing needed - the script handles it!
- Your instance IP will be different from other team members' IPs

## Need Help?

Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide for more detailed solutions.

