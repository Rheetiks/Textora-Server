# Base image with JDK
FROM openjdk:20-jdk-bullseye

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=1000
ENV CHOKIDAR_IGNORE=public

WORKDIR /app

COPY textora-backend/ ./textora-backend/
COPY textora-websocket-server/ ./textora-websocket-server/

WORKDIR /app/textora-backend
# Install Maven
RUN apt-get update && apt-get install -y maven

WORKDIR /app/textora-backend
RUN mvn clean package -DskipTests

WORKDIR /app/textora-websocket-server
RUN npm ci

EXPOSE 8080 1999

WORKDIR /app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]
