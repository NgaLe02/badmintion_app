# badminton-app

Spring Boot project with Hibernate (JPA), MySQL, and Spring Security using JWT.

## Stack

- Spring Boot 3
- Spring Security
- Spring Data JPA (Hibernate)
- MySQL
- JWT (io.jsonwebtoken)

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+

## Configuration

Edit `src/main/resources/application.yml`:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `security.jwt.secret-key` (Base64-encoded key)

Default JWT secret is provided for local development only.

## Run

```bash
mvn spring-boot:run
```

## API

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "StrongPass123"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "StrongPass123"
}
```

### Protected endpoint

```http
GET /api/secure/ping
Authorization: Bearer <token>
```
