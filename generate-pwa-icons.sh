#!/bin/bash

# PWA Icon Generator Script
# This script helps generate PWA icons from your logo
# 
# Prerequisites: ImageMagick must be installed
# Install on Ubuntu/Debian: sudo apt-get install imagemagick
# Install on macOS: brew install imagemagick
#
# Usage: ./generate-pwa-icons.sh path/to/your/logo.png

SOURCE_IMAGE=${1:-"public/nav-logo.png"}

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image not found: $SOURCE_IMAGE"
    echo "Usage: ./generate-pwa-icons.sh path/to/your/logo.png"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Install it using:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

ICON_DIR="public/icons"
mkdir -p "$ICON_DIR"

SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons from: $SOURCE_IMAGE"
echo "Output directory: $ICON_DIR"
echo ""

for SIZE in "${SIZES[@]}"; do
    OUTPUT="${ICON_DIR}/icon-${SIZE}x${SIZE}.png"
    echo "Generating ${SIZE}x${SIZE}..."
    convert "$SOURCE_IMAGE" -resize ${SIZE}x${SIZE} "$OUTPUT"
done

echo ""
echo "✓ PWA icons generated successfully!"
echo ""
echo "Generated icons:"
ls -lh "$ICON_DIR"
