using System.Security.Claims;
using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.JobCards;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Workshop.API.Controllers;
using Xunit;

namespace Fleet.Tests.Controllers;

/// <summary>
/// Verifies that <see cref="JobCardsController"/> enforces tenant isolation:
/// callers can only see and touch job cards belonging to their own tenant,
/// while SystemAdmin can see everything.
/// </summary>
public class JobCardsControllerTenantIsolationTests
{
    // ---- Minimal in-memory fake service (no mocking library available) ----
    private sealed class FakeJobCardService : IJobCardService
    {
        public readonly List<JobCard> Items = new();
        public JobCard? LastCreated;

        public Task<IEnumerable<JobCard>> GetAllJobCardsAsync() => Task.FromResult<IEnumerable<JobCard>>(Items.ToList());
        public Task<JobCard?> GetJobCardByIdAsync(int id) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<JobCard?> GetJobCardByJobNumberAsync(string jobNumber) => Task.FromResult(Items.FirstOrDefault(x => x.JobNumber == jobNumber));
        public Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.VehicleId == vehicleId).ToList());
        public Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.AssignedToUserId == userId).ToList());
        public Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status) => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.Status == status).ToList());
        public Task<IEnumerable<JobCard>> GetOpenJobCardsAsync() => Task.FromResult<IEnumerable<JobCard>>(Items.Where(x => x.Status == "Open").ToList());

        public Task<JobCard> CreateJobCardAsync(JobCard jobCard)
        {
            jobCard.Id = Items.Count + 1;
            LastCreated = jobCard;
            Items.Add(jobCard);
            return Task.FromResult(jobCard);
        }

        public Task<JobCard> UpdateJobCardAsync(JobCard jobCard) => Task.FromResult(jobCard);
        public Task<bool> DeleteJobCardAsync(int id) => Task.FromResult(Items.RemoveAll(x => x.Id == id) > 0);
        public Task<JobCard> StartJobCardAsync(int id, int? assignedToUserId = null) => Task.FromResult(Items.First(x => x.Id == id));
        public Task<JobCard> CompleteJobCardAsync(int id, decimal? actualCost = null) => Task.FromResult(Items.First(x => x.Id == id));
        public Task<JobCard> CancelJobCardAsync(int id) => Task.FromResult(Items.First(x => x.Id == id));
        public Task<JobCard> ConvertFaultToJobCardAsync(int faultId, int? assignedToUserId = null, decimal estimatedCost = 0) => throw new NotImplementedException();
        public Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId) => Task.FromResult<IEnumerable<JobCardTask>>(new List<JobCardTask>());
        public Task<JobCardTask> AddTaskToJobCardAsync(int jobCardId, JobCardTask task) => Task.FromResult(task);
        public Task<JobCardTask> UpdateTaskAsync(JobCardTask task) => Task.FromResult(task);
    }

    private static JobCardsController BuildController(FakeJobCardService service, int? tenantId, bool isSystemAdmin = false)
    {
        var claims = new List<Claim>();
        if (tenantId is not null)
            claims.Add(new Claim("TenantId", tenantId.Value.ToString()));
        if (isSystemAdmin)
            claims.Add(new Claim(ClaimTypes.Role, "SystemAdmin"));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: "Test", nameType: ClaimTypes.Name, roleType: ClaimTypes.Role));

        return new JobCardsController(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            }
        };
    }

    private static JobCard MakeJobCard(int id, int tenantId, string status = "Open") => new()
    {
        Id = id,
        TenantId = tenantId,
        VehicleId = 1,
        JobNumber = $"JOB-{id}",
        Title = $"Job {id}",
        Priority = "Medium",
        Status = status
    };

    [Fact]
    public async Task GetById_ReturnsForbid_WhenJobCardBelongsToAnotherTenant()
    {
        var service = new FakeJobCardService();
        service.Items.Add(MakeJobCard(1, tenantId: 99));
        var controller = BuildController(service, tenantId: 1);

        var result = await controller.GetById(1);

        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetById_ReturnsJobCard_WhenSameTenant()
    {
        var service = new FakeJobCardService();
        service.Items.Add(MakeJobCard(1, tenantId: 1));
        var controller = BuildController(service, tenantId: 1);

        var result = await controller.GetById(1);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_ReturnsJobCard_ForSystemAdmin_AcrossTenants()
    {
        var service = new FakeJobCardService();
        service.Items.Add(MakeJobCard(1, tenantId: 99));
        var controller = BuildController(service, tenantId: null, isSystemAdmin: true);

        var result = await controller.GetById(1);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAll_OnlyReturnsCurrentTenantJobCards()
    {
        var service = new FakeJobCardService();
        service.Items.Add(MakeJobCard(1, tenantId: 1));
        service.Items.Add(MakeJobCard(2, tenantId: 1));
        service.Items.Add(MakeJobCard(3, tenantId: 99));
        var controller = BuildController(service, tenantId: 1);

        var result = await controller.GetAll(new JobCardQuery());

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var paged = ok.Value.Should().BeOfType<PagedResult<JobCardListViewModel>>().Subject;
        paged.Items.Should().OnlyContain(j => j.Id == 1 || j.Id == 2);
        paged.Items.Should().NotContain(j => j.Id == 3);
    }

    [Fact]
    public async Task GetAll_ReturnsAll_ForSystemAdmin()
    {
        var service = new FakeJobCardService();
        service.Items.Add(MakeJobCard(1, tenantId: 1));
        service.Items.Add(MakeJobCard(2, tenantId: 99));
        var controller = BuildController(service, tenantId: null, isSystemAdmin: true);

        var result = await controller.GetAll(new JobCardQuery());

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var paged = ok.Value.Should().BeOfType<PagedResult<JobCardListViewModel>>().Subject;
        paged.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task Create_SetsTenantIdFromCaller()
    {
        var service = new FakeJobCardService();
        var controller = BuildController(service, tenantId: 7);

        var model = new CreateJobCardViewModel
        {
            VehicleId = 1,
            Title = "New job",
            Priority = "Medium",
            Status = "Open"
        };

        await controller.Create(model);

        service.LastCreated.Should().NotBeNull();
        service.LastCreated!.TenantId.Should().Be(7);
    }
}
