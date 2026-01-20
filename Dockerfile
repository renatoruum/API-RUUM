# ========================================
# Stage 1: Builder
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (optimize dependency cache)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code (always updated, no cache issues)
COPY . .

# ========================================
# Stage 2: Runtime
# ========================================
FROM node:20-alpine

WORKDIR /app

# Copy from builder (always fresh, no cache)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/credentials ./credentials
COPY --from=builder /app/assets ./assets

# DEBUG: Verify files are copied and show hash
RUN echo "=== DEBUG BUILD $(date) ===" > /app/BUILD_INFO.txt && \
    ls -la /app/src/services/ >> /app/BUILD_INFO.txt && \
    sha256sum /app/src/services/ffmpeg.service.js >> /app/BUILD_INFO.txt || echo "File not found" >> /app/BUILD_INFO.txt && \
    grep -n "preset.*medium\|preset.*slow" /app/src/services/ffmpeg.service.js >> /app/BUILD_INFO.txt || echo "Preset not found" >> /app/BUILD_INFO.txt

# Create necessary directories
RUN mkdir -p temp/uploads temp/processing outputs/videos

# Expose the port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
