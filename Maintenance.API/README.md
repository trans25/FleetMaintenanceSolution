# Maintenance.API - Maintenance Operations Service

Maintenance operations microservice for the Fleet Maintenance System.

## Responsibility
- Fault/issue tracking
- Job card (work order) management
- Service schedule management
- Task management for job cards

## Port
- HTTP: `http://localhost:5003`
- HTTPS: `https://localhost:7003`

## Controllers
- **FaultController** - `/api/Fault`
- **JobCardController** - `/api/JobCard`
- **ServiceScheduleController** - `/api/ServiceSchedule`

## Key Endpoints

### Faults
- `GET /api/Fault` - Get all faults
- `GET /api/Fault/{id}` - Get fault by ID
- `GET /api/Fault/vehicle/{vehicleId}` - Get faults by vehicle
- `GET /api/Fault/status/{status}` - Get faults by status
- `GET /api/Fault/severity/{severity}` - Get faults by severity
- `GET /api/Fault/open` - Get open faults
- `POST /api/Fault` - Report new fault
- `PUT /api/Fault/{id}` - Update fault
- `DELETE /api/Fault/{id}` - Delete fault

### Job Cards
- `GET /api/JobCard` - Get all job cards
- `GET /api/JobCard/{id}` - Get job card by ID
- `GET /api/JobCard/job/{jobNumber}` - Get by job number
- `GET /api/JobCard/vehicle/{vehicleId}` - Get job cards by vehicle
- `GET /api/JobCard/assigned/{userId}` - Get assigned job cards
- `GET /api/JobCard/status/{status}` - Get job cards by status
- `GET /api/JobCard/open` - Get open job cards
- `GET /api/JobCard/{jobCardId}/tasks` - Get tasks for job card
- `POST /api/JobCard` - Create job card
- `POST /api/JobCard/{jobCardId}/tasks` - Add task to job card
- `PUT /api/JobCard/{id}` - Update job card
- `PUT /api/JobCard/tasks/{taskId}` - Update task
- `DELETE /api/JobCard/{id}` - Delete job card

### Service Schedules
- `GET /api/ServiceSchedule` - Get all schedules
- `GET /api/ServiceSchedule/{id}` - Get schedule by ID
- `GET /api/ServiceSchedule/vehicle/{vehicleId}` - Get schedules by vehicle
- `GET /api/ServiceSchedule/upcoming` - Get upcoming schedules (30 days)
- `GET /api/ServiceSchedule/overdue` - Get overdue schedules
- `POST /api/ServiceSchedule` - Create schedule
- `PUT /api/ServiceSchedule/{id}` - Update schedule
- `DELETE /api/ServiceSchedule/{id}` - Delete schedule

## Authentication
All endpoints require JWT token from Auth.API:

```http
Authorization: Bearer {token}
```

## Running

```powershell
cd Maintenance.API
dotnet run
```

Swagger UI: http://localhost:5003/swagger

## See Also
- [Microservices Architecture](../MICROSERVICES.md)
- [Main README](../README.md)
