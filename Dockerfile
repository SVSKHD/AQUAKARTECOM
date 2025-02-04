# Use a specific version of Node.js on Alpine for a smaller image size
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install pnpm using Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json and pnpm-lock.yaml for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application using PM2
CMD ["pm2-runtime", "start", "pnpm", "--", "start"]
