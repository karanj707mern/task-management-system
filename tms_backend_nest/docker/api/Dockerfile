FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema and migrations
COPY prisma ./prisma

# Copy email templates
COPY --from=builder /app/templates ./templates

# Copy environment variables
COPY .env .env

# Install production dependencies
RUN npm install --production

# Create uploads directory
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "dist/main"]