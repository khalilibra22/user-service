# Use official Node.js LTS (Long Term Support) image as the base image
FROM node:18

# Set working directory in the container
WORKDIR /permissions_service

# Copy package.json and package-lock.json (if present) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./ ./

# Rebuild bcrypt inside the Docker container
RUN npm rebuild bcrypt --build-from-source

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000


# Command to run the application
CMD ["node", "dist/index.js"]
