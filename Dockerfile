# We will use a Compose file instead for multi-service support
# But here is the Backend Dockerfile as a sample
FROM node:18
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
EXPOSE 5050
CMD ["node", "server.js"]