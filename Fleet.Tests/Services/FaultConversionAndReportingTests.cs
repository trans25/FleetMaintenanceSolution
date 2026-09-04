using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Fleet.Core.Services;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Services;

public class FaultConversionAndReportingTests
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

    private sealed class Harness
    {
        public FakeJobCardRepository JobCards { get; } = new();
        public FakeJobCardTaskRepository Tasks { get; } = new();
        public FakeVehicleRepository Vehicles { get; } = new();
        public FakeFaultRepository Faults { get; } = new();
        public FakeServiceScheduleRepository Schedules { get; } = new();
        public JobCardService JobCardService { get; }
        public MaintenanceReportService ReportService { get; }

        public Harness()
        {
            JobCardService = new JobCardService(JobCards, Tasks, Vehicles, Faults, Schedules);
            ReportService = new MaintenanceReportService(Vehicles, JobCards);
        }

        public Vehicle SeedVehicle(int id, int fleetId = 1, string status = MaintenanceStatuses.Vehicle.Active)
        {
            var v = new Vehicle
            {
                Id = id,
                FleetId = fleetId,
                RegistrationNumber = $"REG{id:0000}",
                VIN = $"VIN{id:00000000000000}",
                Status = status,
                Mileage = 50000
            };
            Vehicles.Items.Add(v);
            return v;
        }
    }

    // ---- Fault -> JobCard conversion ----

    [Fact]
    public async Task ConvertFaultToJobCard_CreatesLinkedJobCard_AndMovesFaultInProgress()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle(1);
        var fault = new Fault
        {
            Id = 10,
            VehicleId = vehicle.Id,
            Title = "Engine warning light",
            Severity = "Critical",
            Status = MaintenanceStatuses.Fault.Reported
        };
        h.Faults.Items.Add(fault);

        var jobCard = await h.JobCardService.ConvertFaultToJobCardAsync(fault.Id, assignedToUserId: 7, estimatedCost: 250m);

        jobCard.FaultId.Should().Be(fault.Id);
        jobCard.VehicleId.Should().Be(vehicle.Id);
        jobCard.Title.Should().Be("Engine warning light");
        jobCard.Priority.Should().Be("Urgent");
        jobCard.AssignedToUserId.Should().Be(7);
        jobCard.EstimatedCost.Should().Be(250m);
        jobCard.Status.Should().Be(MaintenanceStatuses.JobCard.Open);
        fault.Status.Should().Be(MaintenanceStatuses.Fault.InProgress);
        vehicle.Status.Should().Be(MaintenanceStatuses.Vehicle.InService);
    }

    [Fact]
    public async Task ConvertFaultToJobCard_Throws_WhenFaultAlreadyResolved()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle(1);
        var fault = new Fault
        {
            Id = 11,
            VehicleId = vehicle.Id,
            Status = MaintenanceStatuses.Fault.Resolved
        };
        h.Faults.Items.Add(fault);

        var act = async () => await h.JobCardService.ConvertFaultToJobCardAsync(fault.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ConvertFaultToJobCard_Throws_WhenActiveJobCardAlreadyExists()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle(1);
        var fault = new Fault
        {
            Id = 12,
            VehicleId = vehicle.Id,
            Status = MaintenanceStatuses.Fault.Reported
        };
        h.Faults.Items.Add(fault);

        await h.JobCardService.ConvertFaultToJobCardAsync(fault.Id);
        var act = async () => await h.JobCardService.ConvertFaultToJobCardAsync(fault.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ConvertFaultToJobCard_Throws_WhenFaultNotFound()
    {
        var h = new Harness();

        var act = async () => await h.JobCardService.ConvertFaultToJobCardAsync(999);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ---- Cost reporting ----

    [Fact]
    public async Task GetVehicleCostReport_RollsUpCountsAndCosts()
    {
        var h = new Harness();
        var vehicle = h.SeedVehicle(1);
        h.JobCards.Items.Add(new JobCard { Id = 1, VehicleId = vehicle.Id, Status = MaintenanceStatuses.JobCard.Completed, EstimatedCost = 100m, ActualCost = 120m });
        h.JobCards.Items.Add(new JobCard { Id = 2, VehicleId = vehicle.Id, Status = MaintenanceStatuses.JobCard.Open, EstimatedCost = 50m, ActualCost = null });
        h.JobCards.Items.Add(new JobCard { Id = 3, VehicleId = vehicle.Id, Status = MaintenanceStatuses.JobCard.Cancelled, EstimatedCost = 30m, ActualCost = null });

        var report = await h.ReportService.GetVehicleCostReportAsync(vehicle.Id);

        report.Should().NotBeNull();
        report!.TotalJobCards.Should().Be(3);
        report.CompletedJobCards.Should().Be(1);
        report.OpenJobCards.Should().Be(1);
        report.TotalEstimatedCost.Should().Be(180m);
        report.TotalActualCost.Should().Be(120m);
    }

    [Fact]
    public async Task GetVehicleCostReport_ReturnsNull_WhenVehicleMissing()
    {
        var h = new Harness();

        var report = await h.ReportService.GetVehicleCostReportAsync(404);

        report.Should().BeNull();
    }

    [Fact]
    public async Task GetFleetCostReport_AggregatesAcrossVehicles()
    {
        var h = new Harness();
        var v1 = h.SeedVehicle(1, fleetId: 5);
        var v2 = h.SeedVehicle(2, fleetId: 5);
        h.SeedVehicle(3, fleetId: 9); // different fleet, must be excluded

        h.JobCards.Items.Add(new JobCard { Id = 1, VehicleId = v1.Id, Status = MaintenanceStatuses.JobCard.Completed, EstimatedCost = 100m, ActualCost = 100m });
        h.JobCards.Items.Add(new JobCard { Id = 2, VehicleId = v2.Id, Status = MaintenanceStatuses.JobCard.Completed, EstimatedCost = 200m, ActualCost = 250m });
        h.JobCards.Items.Add(new JobCard { Id = 3, VehicleId = 3, Status = MaintenanceStatuses.JobCard.Completed, EstimatedCost = 999m, ActualCost = 999m });

        var report = await h.ReportService.GetFleetCostReportAsync(5);

        report.FleetId.Should().Be(5);
        report.VehicleCount.Should().Be(2);
        report.TotalJobCards.Should().Be(2);
        report.CompletedJobCards.Should().Be(2);
        report.TotalEstimatedCost.Should().Be(300m);
        report.TotalActualCost.Should().Be(350m);
        report.Vehicles.Should().HaveCount(2);
    }
}
