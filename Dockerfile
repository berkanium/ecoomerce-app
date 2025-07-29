FROM node:18-alpine

# Güvenlik için non-root user oluştur
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Çalışma dizini
WORKDIR /app

# Package files kopyala
COPY package*.json ./

# Dependencies yükle
RUN npm ci --only=production && npm cache clean --force

# Source code kopyala
COPY . .

# Uploads klasörü oluştur 
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

# Non-root user'a geç
USER nodejs

# Port expose et
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command
CMD ["node", "server.js"]