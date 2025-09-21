#!/bin/bash

echo "🚀 FINAL FIX FOR HEALTHSCRIBE PRO SELF-HOSTED SETUP"
echo "=================================================="

# 1. Check what's running on port 3001
echo "📋 Step 1: Checking port 3001..."
cd /var/www/healthscribe/
sudo lsof -i :3001 || echo "Port 3001 is free"

# 2. Check if Next.js is actually running on port 3001
echo "📋 Step 2: Checking network connections..."
sudo netstat -tulpn | grep :3001

# 3. Fix nginx configuration to properly proxy to Next.js
echo "🔧 Step 3: Updating nginx configuration..."
cat > /etc/nginx/sites-available/healthscribe.pro << 'EOF'
server {
    listen 80;
    server_name healthscribe.pro www.healthscribe.pro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name healthscribe.pro www.healthscribe.pro;

    ssl_certificate /etc/letsencrypt/live/healthscribe.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthscribe.pro/privkey.pem;

    # SSL security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;

    # Main app proxy
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Auth service proxy
    location /auth/ {
        proxy_pass http://localhost:9999/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # CORS for auth endpoints
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
    }

    # REST API proxy (PostgREST)
    location /rest/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # CORS for API endpoints
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, apikey' always;
    }
}
EOF

# 4. Test nginx configuration
echo "✅ Step 4: Testing nginx configuration..."
sudo nginx -t

# 5. Reload nginx
echo "🔄 Step 5: Reloading nginx..."
sudo systemctl reload nginx

# 6. Check nginx status
echo "📊 Step 6: Checking nginx status..."
sudo systemctl status nginx --no-pager

# 7. Fix the auth service (create a new working version)
echo "🔧 Step 7: Creating new auth service..."
cat > /var/www/healthscribe/auth-service.js << 'EOF'
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

const JWT_SECRET = 'your-super-secret-jwt-token-with-at-least-32-characters-long';

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'secure_password_2024',
    database: 'postgres'
});

// Connect to database
client.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

// Health check
app.get('/auth/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'Auth service is running' });
});

// Signup endpoint
app.post('/auth/v1/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await client.query(
            'INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) VALUES ($1, $2, NOW()) RETURNING id, email',
            [email, hashedPassword]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                aud: 'authenticated'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            access_token: token,
            token_type: 'bearer',
            expires_in: 86400,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === '23505') { // Unique constraint violation
            res.status(409).json({ error: 'User already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Signin endpoint
app.post('/auth/v1/token', async (req, res) => {
    try {
        const { email, password, grant_type } = req.body;

        if (!email || !password || grant_type !== 'password') {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Find user
        const result = await client.query(
            'SELECT id, email, encrypted_password FROM auth.users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.encrypted_password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                aud: 'authenticated'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            access_token: token,
            token_type: 'bearer',
            expires_in: 86400,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 9999;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});
EOF

# 8. Restart auth service
echo "🔄 Step 8: Restarting auth service..."
pm2 delete auth-service 2>/dev/null || true
pm2 start /var/www/healthscribe/auth-service.js --name "auth-service"

# 9. Install missing dependencies for auth service
echo "📦 Step 9: Installing auth service dependencies..."
cd /var/www/healthscribe/
npm install express cors jsonwebtoken bcryptjs pg

# 10. Check all services
echo "📊 Step 10: Checking all services..."
pm2 status
sudo docker ps

# 11. Test everything
echo "🧪 Step 11: Testing your complete system..."
echo ""
echo "🌐 Testing main website:"
curl -k -s https://healthscribe.pro | head -5

echo ""
echo "🔐 Testing auth service:"
curl -k -s https://healthscribe.pro/auth/v1/health

echo ""
echo "📊 Testing REST API:"
curl -k -s https://healthscribe.pro/rest/ | head -3

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "✅ Your Healthscribe Pro self-hosted system should now be working!"
echo ""
echo "🌐 Website: https://healthscribe.pro"
echo "🔐 Auth: https://healthscribe.pro/auth/v1/health"
echo "📊 API: https://healthscribe.pro/rest/"
echo ""
echo "Try logging in with: admin@healthscribe.pro / password123"



