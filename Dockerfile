FROM node:22-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY backend/ ./backend/
COPY index.html ./index.html
COPY frontend/ ./frontend/
COPY assets/ ./assets/
COPY db/ ./db/

EXPOSE 3000

CMD ["npm", "start", "--prefix", "backend"]
