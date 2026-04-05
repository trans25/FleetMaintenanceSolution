# Auth.API - Authentication Service

Authentication and authorization microservice for the Fleet Maintenance System.

## Responsibility
- User authentication via username/password
- JWT token generation
- Role-based authorization claims

## Port
- HTTP: `http://localhost:5001`
- HTTPS: `https://localhost:7001`

## Endpoints

### Login
```http
POST /api/Auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "email": "admin@fleet.com",
  "roles": ["SystemAdmin"]
}
```

## Running

```powershell
cd Auth.API
dotnet run
```

Swagger UI: http://localhost:5001/swagger

## See Also
- [Microservices Architecture](../MICROSERVICES.md)
- [Main README](../README.md)
