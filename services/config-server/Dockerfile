FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /workspace

COPY pom.xml .
COPY src src
COPY config-repo config-repo
COPY mvnw mvnw

RUN chmod +x mvnw && ./mvnw -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /workspace/target/trend-burada-config-server-0.1.0-SNAPSHOT.jar app.jar
COPY --from=builder /workspace/config-repo ./config-repo

EXPOSE 8888

ENTRYPOINT ["java","-jar","/app/app.jar"]
