# 1. Use Node as base
FROM node:18-bullseye-slim

# 2. Install Redis Server
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 3. Install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy backend code
COPY . .

# 5. Create a start script to run both Redis and Node
RUN echo "#!/bin/sh\nredis-server --daemonize yes\nnode server.js" > start.sh
RUN chmod +x start.sh

EXPOSE 5050

# 6. Run the script
CMD ["./start.sh"]