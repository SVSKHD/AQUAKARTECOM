# Use a specific version of node on Alpine for a smaller image size
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Enable and prepare pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) first for better caching
COPY package*.json npm-shrinkwrap.json* ./

# Install PM2 globally
RUN pnpm add -g pm2

# Install dependencies
RUN pnpm install --prod

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application using PM2
CMD ["pm2-runtime", "start", "npm", "--", "start"]