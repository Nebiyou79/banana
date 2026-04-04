FROM node:18-bullseye

WORKDIR /app

# Copy .env.production file
COPY .env.production .env.production

# Install dependencies first
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Create uploads directories (volume-safe)
# FIX: Create all actual multer upload targets inside /app/uploads
RUN mkdir -p \
  /app/uploads/cv \
  /app/uploads/applications \
  /app/uploads/tenders \
  /app/uploads/proposals \
  /app/uploads/documents \
  /app/uploads/avatars \
  /app/uploads/covers \
  /app/uploads/general \
  /app/uploads/thumbnails \
  /app/uploads/portfolio \
 && chmod -R 755 /app/uploads

ENV NODE_ENV=production
ENV PORT=4000
# ADD: UPLOAD_BASE_PATH environment variable for all controllers
ENV UPLOAD_BASE_PATH=/app/uploads

EXPOSE 4000

CMD ["npm", "start"]