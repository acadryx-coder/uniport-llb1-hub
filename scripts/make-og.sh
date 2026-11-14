#!/usr/bin/env bash
set -e
echo "Converting public/og-default.svg → public/og-default.png …"
npx -y -p sharp node -e "require('sharp')('public/og-default.svg').png().toFile('public/og-default.png').then(() => console.log('✓ public/og-default.png created'))"
