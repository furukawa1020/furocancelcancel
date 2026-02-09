FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Initialize DB if needed (or do it in code on start)
# RUN npm run db:migrate 

EXPOSE 3000

CMD ["node", "server.js"]
