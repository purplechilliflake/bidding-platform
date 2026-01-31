FROM node:18-bullseye-slim

# Install redis-server
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create a startup script to run both Redis and Node
RUN echo "#!/bin/sh\nredis-server --daemonize yes\nnode server.js" > start.sh
RUN chmod +x start.sh

EXPOSE 5050

# Run the startup script
CMD ["./start.sh"]