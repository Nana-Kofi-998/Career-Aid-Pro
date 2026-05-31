# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Run the FastAPI backend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api/ ./api/
COPY career_aid_pro/ ./career_aid_pro/
COPY app.py .

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose container port
EXPOSE 8000

# Create persistent storage folder for SQLite
RUN mkdir -p /data

# Set default runtime environment variables
ENV PORT=8000
ENV CAREER_AID_DB=/data/career_aid_pro.db
ENV CAREER_AID_ENV=production

# Run Uvicorn server
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port $PORT"]
