# Use a stable Node image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Your index.js should use process.env.PORT
CMD ["node", "index.js"]