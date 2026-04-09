# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
# Copy frontend source code
COPY UniEventClient/web .
# Install dependencies
RUN npm ci
# Build the frontend application
RUN npm run build

# Stage 2: Build backend
FROM eclipse-temurin:25-jdk-alpine AS backend-build
WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy pom.xml
COPY UniEventServer/pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY UniEventServer/src src

# Copy built frontend into static folder
COPY --from=frontend-build /app/frontend/dist src/main/resources/static

# Build the application
RUN mvn package -DskipTests -B

# Stage 3: Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Copy the built jar from backend build stage
COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

