FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 1999

CMD ["sh", "-c", "npx partykit dev --port 1999"]

