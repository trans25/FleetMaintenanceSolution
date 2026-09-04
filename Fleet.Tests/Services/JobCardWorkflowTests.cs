using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Fleet.Core.Services;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Services;

public class JobCardWorkflowTests
{
    // ---- In-memory fake repositories (no mocking library available) ----

    private sealed class FakeJobCardRepository : IJobCardRepository
    {
        public readonly List<JobCard> Items = new();
        private int _nextId = 1;

        public Task<IEnumerable<JobCard>> GetAllAsync() => Task.FromResult<IEnumerable<JobCard>>(Items.ToList());
        public Task<JobCard?> GetByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<JobCard> AddAsync(JobCard entity)
        {
            entity.Id = _nextId++;
            Items.Add(entity);
            return Task.FromResult(entity);
        }
        public Task<JobCard> UpdateAsync(JobCard entity) => Task.FromResult(entity);
        public Task<bool> DeleteAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<JobCard?> GetByJobNumberAsync(string jobNumber) => Task.FromResult(Items.FirstOrDefault(x => x.JobNumber == jobNumber));
        public Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.VehicleId == vehicleId).ToList());
        public Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.Status == status).ToList());
        public Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.AssignedToUserId == userId).ToList());
    }

    private sealed class FakeJobCardTaskRepository : IJobCardTaskRepository
    {
        public readonly List<JobCardTask> Items = new();
        private int _nextId = 1;

        public Task<IEnumerable<JobCardTask>> GetAllAsync() => Task.FromResult<IEnumerable<JobCardTask>>(Items.ToList());
        public Task<JobCardTask?> GetByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<JobCardTask> AddAsync(JobCardTask entity)
        {
            entity.Id = _nextId++;
            Items.Add(entity);
            return Task.FromResult(entity);
        }
        public Task<JobCardTask> UpdateAsync(JobCardTask entity) => Task.FromResult(entity);
        public Task<bool> DeleteAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId) => Task.FromResult<IEnumerable<JobCardTask>>(Items.Where(x => x.JobCardId == jobCardId).ToList());
        public Task<IEnumerable<JobCardTask>> GetCompletedTasksAsync() => Task.FromResult<IEnumerable<JobCardTask>>(Items.Where(x => x.IsCompleted).ToList());
        public Task<IEnumerable<JobCardTask>> GetPendingTasksAsync() => Task.FromResult<IEnumerable<JobCardTask>>(Items.Where(x => !x.IsCompleted).ToList());
    }

    private sealed class FakeVehicleRepository : IVehicleRepository
    {
        public readonly List<Vehicle> Items = new();
        private int _nextId = 1;

        public Task<IEnumerable<Vehicle>> GetAllAsync() => Task.FromResult<IEnumerable<Vehicle>>(Items.ToList());
        public Task<Vehicle?> GetByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<Vehicle> AddAsync(Vehicle entity)
        {
            entity.Id = _nextId++;
            Items.Add(entity);
            return Task.FromResult(entity);
        }
        public Task<Vehicle> UpdateAsync(Vehicle entity) => Task.FromResult(entity);
        public Task<bool> DeleteAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<Vehicle?> GetByRegistrationNumberAsync(string registrationNumber) => Task.FromResult(Items.FirstOrDefault(x => x.RegistrationNumber == registrationNumber));
        public Task<Vehicle?> GetByVINAsync(string vin) => Task.FromResult(Items.FirstOrDefault(x => x.VIN == vin));
        public Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId) => Task.FromResult<IEnumerable<Vehicle>>(Items.Where(x => x.FleetId == fleetId).ToList());
        public Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status) => Task.FromResult<IEnumerable<Vehicle>>(Items.Where(x => x.Status == status).ToList());
    }

    private sealed class FakeFaultRepository : IFaultRepository
    {
        public readonly List<Fault> Items = new();
        private int _nextId = 1;

        public Task<IEnumerable<Fault>> GetAllAsync() => Task.FromResult<IEnumerable<Fault>>(Items.ToList());
        public Task<Fault?> GetByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<Fault> AddAsync(Fault entity)
        {
            entity.Id = _nextId++;
            Items.Add(entity);
            return Task.FromResult(entity);
        }
        public Task<Fault> UpdateAsync(Fault entity) => Task.FromResult(entity);
        public Task<bool> DeleteAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId) => Task.FromResult<IEnumerable<Fault>>(Items.Where(x => x.VehicleId == vehicleId).ToList());
        public Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status) => Task.FromResult<IEnumerable<Fault>>(Items.Where(x => x.Status == status).ToList());
        public Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity) => Task.FromResult<IEnumerable<Fault>>(Items.Where(x => x.Severity == severity).ToList());
    }

    private sealed class FakeServiceScheduleRepository : IServiceScheduleRepository
    {
        public readonly List<ServiceSchedule> Items = new();
        private int _nextId = 1;

        public Task<IEnumerable<ServiceSchedule>> GetAllAsync() => Task.FromResult<IEnumerable<ServiceSchedule>>(Items.ToList());
        public Task<ServiceSchedule?> GetByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<ServiceSchedule> AddAsync(ServiceSchedule entity)
        {
            entity.Id = _nextId++;
            Items.Add(entity);
            return Task.FromResult(entity);
        }
        public Task<ServiceSchedule> UpdateAsync(ServiceSchedule entity) => Task.FromResult(entity);
        public Task<bool> DeleteAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId) => Task.FromResult<IEnumerable<ServiceSchedule>>(Items.Where(x => x.VehicleId == vehicleId).ToList());
        public Task<IEnumerable<ServiceSchedule>> GetSchedulesByStatusAsync(string status) => Task.FromResult<IEnumerable<ServiceSchedule>>(Items.Where(x => x.Status == status).ToList());
        public Task<IEnumerable<ServiceSchedule>> GetUpcomingServicesAsync(DateTime date) => Task.FromResult<IEnumerable<ServiceSchedule>>(Items.Where(x => x.ScheduledDate >= date).ToList());
    }

    // ---- Test harness ----

    private sealed class Harness
    {
        public FakeJobCardRepository JobCards { get; } = new();
        public FakeJobCardTaskRepository Tasks { get; } = new();
        public FakeVehicleRepository Vehicles { get; } = new();
        public FakeFaultRepository Faults { get; } = new();
        public FakeServiceScheduleRepository Schedules { get; } = new();
        public JobCardService Service { get; }

        public Harness()
        {
            Service = new JobCardService(JobCards, Tasks, Vehicles, Faults, Schedules);
        }

        public Vehicle SeedVehicle(string status = MaintenanceStatuses.Vehicle.Active)
        {
            var v = new Vehicle { Id = 1, RegistrationNumber = "CA123456", Status = status, Mileage = 50000 };
            Vehicles.Items.Add(v);
            return v;
        }
    }

    [Fact]
    public async Task CreateJobCard_SetsOpenStatus_AndMovesVehicleIntoService()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();

        var created = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Brake repair" });

        created.Status.Should().Be(MaintenanceStatuses.JobCard.Open);
        created.JobNumber.Should().NotBeNullOrWhiteSpace();
        vehicle.Status.Should().Be(MaintenanceStatuses.Vehicle.InService);
    }

    [Fact]
    public async Task CreateJobCard_FromFault_MovesFaultToInProgress()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var fault = new Fault { Id = 5, VehicleId = vehicle.Id, Status = MaintenanceStatuses.Fault.Reported };
        h.Faults.Items.Add(fault);

        await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, FaultId = fault.Id, Title = "Fix" });

        fault.Status.Should().Be(MaintenanceStatuses.Fault.InProgress);
    }

    [Fact]
    public async Task StartJobCard_SetsInProgress_AndStampsStartDate()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var jc = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Service" });

        var started = await h.Service.StartJobCardAsync(jc.Id, assignedToUserId: 7);

        started.Status.Should().Be(MaintenanceStatuses.JobCard.InProgress);
        started.StartDate.Should().NotBeNull();
        started.AssignedToUserId.Should().Be(7);
    }

    [Fact]
    public async Task CompleteJobCard_WithOutstandingTasks_Throws()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var jc = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Service" });
        await h.Service.StartJobCardAsync(jc.Id);
        h.Tasks.Items.Add(new JobCardTask { Id = 1, JobCardId = jc.Id, TaskName = "Oil", IsCompleted = false });

        var act = async () => await h.Service.CompleteJobCardAsync(jc.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CompleteJobCard_ClosesJob_ResolvesFault_CompletesSchedule_AndFreesVehicle()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var fault = new Fault { Id = 5, VehicleId = vehicle.Id, Status = MaintenanceStatuses.Fault.Reported };
        h.Faults.Items.Add(fault);
        var schedule = new ServiceSchedule { Id = 3, VehicleId = vehicle.Id, Status = MaintenanceStatuses.ServiceSchedule.Scheduled };
        h.Schedules.Items.Add(schedule);

        var jc = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, FaultId = fault.Id, Title = "Service" });
        await h.Service.StartJobCardAsync(jc.Id);
        h.Tasks.Items.Add(new JobCardTask { Id = 1, JobCardId = jc.Id, TaskName = "Oil", IsCompleted = true });

        var completed = await h.Service.CompleteJobCardAsync(jc.Id, actualCost: 1200m);

        completed.Status.Should().Be(MaintenanceStatuses.JobCard.Completed);
        completed.CompletedDate.Should().NotBeNull();
        completed.ActualCost.Should().Be(1200m);
        fault.Status.Should().Be(MaintenanceStatuses.Fault.Resolved);
        schedule.Status.Should().Be(MaintenanceStatuses.ServiceSchedule.Completed);
        vehicle.Status.Should().Be(MaintenanceStatuses.Vehicle.Active);
        vehicle.LastServiceDate.Should().NotBeNull();
    }

    [Fact]
    public async Task CompleteJobCard_KeepsVehicleInService_WhenAnotherJobIsOpen()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();

        var jc1 = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Job1" });
        var jc2 = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Job2" });
        await h.Service.StartJobCardAsync(jc1.Id);

        await h.Service.CompleteJobCardAsync(jc1.Id);

        vehicle.Status.Should().Be(MaintenanceStatuses.Vehicle.InService, "job 2 is still open");
    }

    [Fact]
    public async Task CancelJobCard_FromOpen_FreesVehicle()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var jc = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Service" });

        var cancelled = await h.Service.CancelJobCardAsync(jc.Id);

        cancelled.Status.Should().Be(MaintenanceStatuses.JobCard.Cancelled);
        vehicle.Status.Should().Be(MaintenanceStatuses.Vehicle.Active);
    }

    [Fact]
    public async Task CompleteJobCard_ThatIsStillOpen_Throws_InvalidTransition()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle();
        var jc = await h.Service.CreateJobCardAsync(new JobCard { VehicleId = vehicle.Id, Title = "Service" });

        // Open -> Completed is not allowed (must go through InProgress).
        var act = async () => await h.Service.CompleteJobCardAsync(jc.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
