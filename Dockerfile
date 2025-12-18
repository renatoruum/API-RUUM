# Use Node.js 20 as the base image (required for Firebase)
FROM node:20-alpine

# Install FFmpeg and required dependencies
RUN apk add --no-cache ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code and credentials
COPY src/ ./src/
COPY credentials/ ./credentials/
COPY assets/ ./assets/

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Command to run the application
CMD ["npm", "start"]
