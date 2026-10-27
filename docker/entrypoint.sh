#!/bin/sh
set -eu

: "${DATABASE_URL:?Falta DATABASE_URL}"
: "${AUTH_SECRET:?Falta AUTH_SECRET}"

echo "Aplicando migraciones de base de datos..."
./node_modules/.bin/prisma migrate deploy

echo "Verificando administrador inicial..."
node scripts/bootstrap.mjs

echo "Iniciando la aplicación..."
exec npm start
