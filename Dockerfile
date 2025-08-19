# Base image with JDK
FROM openjdk:20-jdk-bullseye

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY textora-backend/ ./textora-backend/
COPY textora-websocket-server/ ./textora-websocket-server/
COPY textora-backend/mvnw ./textora-backend/mvnw
COPY textora-backend/.mvn ./textora-backend/.mvn

WORKDIR /app/textora-backend
RUN ./mvnw clean package -DskipTests

WORKDIR /app/textora-websocket-server
RUN npm ci

EXPOSE 8080 1999

WORKDIR /app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]
