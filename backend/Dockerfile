# syntax=docker/dockerfile:1

# ---------- Etapa 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copiamos primero el pom para aprovechar la cache de dependencias
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Ahora el código fuente y empaquetamos (sin tests: ya corren en CI)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Etapa 2: runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Usuario no root
RUN groupadd -r app && useradd -r -g app app

COPY --from=build /app/target/tutornow-backend.jar app.jar
RUN chown app:app app.jar
USER app

# Render inyecta $PORT; en local seguimos en 8080
ENV PORT=8080
EXPOSE 8080

# Opciones de JVM razonables para contenedores pequeños (512 MB en Render free)
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC -jar app.jar --server.port=${PORT}"]
