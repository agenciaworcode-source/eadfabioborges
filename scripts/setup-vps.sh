#!/bin/bash
# =============================================================================
# Setup VPS — EAD Mentoria Fábio Borges
# Ubuntu 24.04 LTS
# =============================================================================
# USO: bash setup-vps.sh
# Execute como usuário com sudo ou como root

set -e

echo "==> [1/8] Atualizando pacotes..."
apt-get update && apt-get upgrade -y

echo "==> [2/8] Instalando dependências base..."
apt-get install -y curl git ufw fail2ban nginx certbot python3-certbot-nginx

echo "==> [3/8] Instalando Node.js 22 LTS via nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
nvm alias default 22
node -v
npm -v

echo "==> [4/8] Instalando PM2..."
npm install -g pm2
pm2 startup
pm2 -v

echo "==> [5/8] Configurando UFW (Firewall)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

echo "==> [6/8] Configurando Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(syslog_backend)s
EOF
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> [7/8] Criando diretório da aplicação..."
mkdir -p /var/www/ead
# Clone o repositório:
# git clone https://github.com/SEU_USUARIO/SEU_REPO.git /var/www/ead
# Copie o .env.production:
# cp /root/.env.production /var/www/ead/.env.production

echo "==> [8/8] Configurando SSL com Certbot..."
# Execute após configurar o Nginx:
# certbot --nginx -d ead.fabioborgesoficial.com.br
# Para staging:
# certbot --nginx -d staging.fabioborgesoficial.com.br

echo ""
echo "============================================"
echo "Setup base concluído!"
echo "Próximos passos manuais:"
echo "  1. Copiar scripts/nginx.conf para /etc/nginx/sites-available/ead"
echo "  2. ln -s /etc/nginx/sites-available/ead /etc/nginx/sites-enabled/"
echo "  3. nginx -t && systemctl reload nginx"
echo "  4. certbot --nginx -d ead.fabioborgesoficial.com.br"
echo "  5. cd /var/www/ead && npm ci && npm run build"
echo "  6. pm2 start ecosystem.config.js --env production"
echo "  7. pm2 save"
echo "============================================"
