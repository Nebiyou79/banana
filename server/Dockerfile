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
RUN mkdir -p \
  public/uploads/avatars \
  public/uploads/covers \
  public/uploads/general \
  public/uploads/thumbnails \
  public/uploads/portfolio \
 && chmod -R 755 public/uploads

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]