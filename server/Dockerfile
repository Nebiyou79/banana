FROM node:18-bullseye

WORKDIR /app

# Copy package files FIRST for better caching
COPY package*.json ./

# Install dependencies - use npm install instead of npm ci
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create uploads directories with proper permissions
RUN mkdir -p public/uploads public/uploads/avatars public/uploads/covers public/uploads/general public/uploads/thumbnails public/uploads/portfolio
RUN chmod -R 755 public/uploads

EXPOSE 4000

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]