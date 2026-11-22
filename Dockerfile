FROM node:22-alpine
WORKDIR /app
COPY . .
RUN if [ -f "package.json" ]; then npm ci --omit=dev || npm install --omit=dev; fi
EXPOSE 3000
CMD ["node", "index.js"]