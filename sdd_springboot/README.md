# sdd - Spring Boot API

API REST generada automáticamente a partir de un diagrama de base de datos.

## Ejecutar el proyecto

```bash
./gradlew bootRun
```

## Documentación de API

Una vez ejecutando, accede a Swagger UI para ver y probar los endpoints:
http://localhost:8080/swagger-ui.html

## Estructura del proyecto

- `/src/main/java/com/example/demo/model`: Entidades JPA
- `/src/main/java/com/example/demo/repository`: Repositorios Spring Data JPA
- `/src/main/java/com/example/demo/controller`: Controladores REST
- `/src/main/java/com/example/demo/config`: Configuraciones (CORS, Swagger, etc)

## Base de datos

Por defecto, el proyecto está configurado para usar PostgreSQL. Puedes cambiar esto en `application.properties`.
