#!/bin/bash

# Navigate to the web directory
cd web

# Start npm run dev using nohup in the background
nohup npm run dev > nohup.out 2>&1 &

# Get the PID of the last background command
PID=$!

echo "npm run dev started with PID: $PID"
echo "Output is being redirected to web/nohup.out"

cd ..
