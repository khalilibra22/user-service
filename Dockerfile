# Use lightweight Node.js Alpine image for production
FROM node:22.14.0-alpine

# Set working directory in the container
WORKDIR /user-service

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the compiled JavaScript files from dist directory
COPY dist/ ./dist/

# Copy proto files for gRPC services
COPY proto/ ./proto/

# Copy .env file if it exists (optional, for environment variables)
COPY .env* ./

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
