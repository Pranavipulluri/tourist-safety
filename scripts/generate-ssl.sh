DOMAIN=${1:-localhost}
SSL_DIR="./ssl"

echo "🔐 Generating SSL certificates for $DOMAIN..."

# Create SSL directory
mkdir -p "$SSL_DIR"

# Generate private key
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/csr.pem" -subj "/CN=$DOMAIN/O=Tourist Safety System/C=IN"

# Generate self-signed certificate
openssl x509 -req -in "$SSL_DIR/csr.pem" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365

# Clean up
rm "$SSL_DIR/csr.pem"

# Set permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo "✅ SSL certificates generated:"
echo "   Certificate: $SSL_DIR/cert.pem"
echo "   Private Key: $SSL_DIR/key.pem"

# For production with Let's Encrypt:
if [ "$2" = "letsencrypt" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "🌐 Setting up Let's Encrypt certificate for $DOMAIN..."
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
    
    # Get certificate
    sudo certbot certonly --standalone -d "$DOMAIN" --agree-tos --no-eff-email --register-unsafely-without-email
    
    if [ $? -eq 0 ]; then
        # Copy certificates
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
        sudo chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
        
        echo "✅ Let's Encrypt certificate installed"
        
        # Set up auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    else
        echo "❌ Failed to get Let's Encrypt certificate"
        exit 1
    fi
    
    # Start nginx
    sudo systemctl start nginx
fi
