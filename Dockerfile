FROM node:22-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 3000

CMD ["npm", "start"]
