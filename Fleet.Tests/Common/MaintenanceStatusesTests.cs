using Fleet.Core.Common;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Common;

public class MaintenanceStatusesTests
{
    [Fact]
    public void EnsureTransitionAllowed_AllowsValidJobCardTransition()
    {
        var act = () => MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions,
            MaintenanceStatuses.JobCard.Open,
            MaintenanceStatuses.JobCard.InProgress,
            "job card");

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureTransitionAllowed_AllowsSameStatusNoOp()
    {
        var act = () => MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions,
            MaintenanceStatuses.JobCard.Completed,
            MaintenanceStatuses.JobCard.Completed,
            "job card");

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureTransitionAllowed_RejectsInvalidTransition()
    {
        var act = () => MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions,
            MaintenanceStatuses.JobCard.Open,
            MaintenanceStatuses.JobCard.Completed,
            "job card");

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void EnsureTransitionAllowed_RejectsUnknownStatus()
    {
        var act = () => MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.Fault.Transitions,
            "Bogus",
            MaintenanceStatuses.Fault.Closed,
            "fault");

        act.Should().Throw<ArgumentException>();
    }
}
