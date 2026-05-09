FROM maven:3.9.9-eclipse-temurin-21

WORKDIR /app

COPY backend/pom.xml .

RUN mvn -B -q -DskipTests dependency:go-offline

COPY backend/src ./src

RUN mvn clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/url-expander-1.0.0.jar"]