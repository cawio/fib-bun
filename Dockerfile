FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package.json first for better layer caching
COPY package.json .

COPY bun.lockb* .

# Install dependencies (if any)
RUN bun install --production

# Copy the TypeScript file
COPY fibonacci-api.ts .

# Build the application
RUN bun build --compile --target=bun --outfile=fibonacci-api ./fibonacci-api.ts

# Runtime stage - use a smaller image
FROM oven/bun:slim

WORKDIR /app

# Copy the compiled application from the builder stage
COPY --from=builder /app/fibonacci-api /app/fibonacci-api

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["./fibonacci-api"]