# Build stage
FROM eclipse-temurin:25.0.3_9-jdk-alpine-3.23 AS builder
WORKDIR /app

# Copy Maven wrapper first (cached unless wrapper version changes)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Build
COPY src src
RUN ./mvnw package -DskipTests -B

# Extract the Spring Boot JAR for optimal Docker layer caching
RUN java -Djarmode=tools -jar target/web-*.jar extract --launcher --destination extracted

# Runtime stage
FROM eclipse-temurin:25.0.3_9-jre-alpine
WORKDIR /app

# Copy extracted layers to app root
COPY --from=builder /app/extracted/BOOT-INF BOOT-INF
COPY --from=builder /app/extracted/META-INF META-INF
COPY --from=builder /app/extracted/org org

# Create app user and directories before switching to unprivileged user
RUN addgroup -S app && adduser -S app -G app && \
    mkdir -p /app/logs && \
    chown -R app:app /app
USER app

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
