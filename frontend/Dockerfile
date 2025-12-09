# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Собираем статику в /app/dist
RUN npm run build

CMD ["sh", "-c", "tail -f /dev/null"]