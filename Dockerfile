# Stage 1: Build Stage
FROM node:22.14.0-alpine AS builder

# Set working directory
WORKDIR /user-service

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code and tsconfig
COPY . .

# Build and obfuscate the application
RUN npm run build && npm run obfuscate

# Stage 2: Production Stage
FROM node:22.14.0-alpine

ENV NODE_ENV production

# Set working directory
WORKDIR /user-service

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy only the necessary files from the builder stage
COPY --from=builder /user-service/dist ./dist
COPY --from=builder /user-service/proto ./proto
COPY --from=builder /user-service/.env* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /user-service

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "dist/index.js"]
