#!/bin/bash
echo "Starting Spring Boot..."
java -jar /app/textora-backend/target/textora-backend-0.0.1-SNAPSHOT.jar &

echo "Starting Partykit..."
cd /app/textora-websocket-server
npx partykit serve &

# Wait for all background processes
wait
