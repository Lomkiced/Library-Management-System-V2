#!/bin/sh

set -e

# Directory where certificates will be stored
CERT_DIR="/etc/nginx/certs"
mkdir -p "$CERT_DIR"

# Certificate filenames
KEY_FILE="$CERT_DIR/server.key"
CERT_FILE="$CERT_DIR/server.crt"

# Check if certificates already exist
if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
    echo "SSL certificates found. Skipping generation."
else
    echo "Installing OpenSSL..."
    apk add --no-cache openssl

    echo "Generating self-signed SSL certificates..."
    
    # Generate private key and self-signed certificate in one go
    # -x509: Generate self-signed certificate
    # -nodes: Do not encrypt private key
    # -days 3650: Valid for 10 years
    # -newkey rsa:2048: New RSA key 2048 bits
    # -subj: Subject info (prevents interactive prompt)
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/C=PH/ST=La Union/L=San Fernando/O=Library Management/CN=library.local"
    
    echo "SSL certificates generated successfully."
fi

# Fix permissions
chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"
