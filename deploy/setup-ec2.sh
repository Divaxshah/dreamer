#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y podman caddy

sudo loginctl enable-linger ubuntu

podman pull node:20-alpine

sudo npm install -g pm2

mkdir -p /home/ubuntu/.webmaker/workspaces

if [ ! -f /swapfile ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

sudo iptables -C OUTPUT -d 169.254.169.254 -j DROP 2>/dev/null ||
  sudo iptables -I OUTPUT -d 169.254.169.254 -j DROP
