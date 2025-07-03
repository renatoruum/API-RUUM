# Use Node.js 18 official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (dynamic port from Cloud Run)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
