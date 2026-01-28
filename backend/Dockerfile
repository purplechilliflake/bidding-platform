FROM node:18-bullseye-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

EXPOSE 5050

# Run Node directly (no need for start.sh or redis-server install)
CMD ["node", "server.js"]