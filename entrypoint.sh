#!/bin/bash

# Démarrer mongodb
echo "Starting MongoDB..."
mongod --bind_ip_all --fork --logpath /var/log/mongodb.log --dbpath /data/db

# Attendre que mongodb soit prêt
until mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; do
  echo "Waiting for MongoDB to start..."
  sleep 2
done

echo "MongoDB is ready!"

echo "Starting Application..."
exec pnpm start
