using System.Security.Claims;
using Fleet.Core.Common;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Common;

public class ClaimsPrincipalExtensionsTests
{
    private static ClaimsPrincipal BuildPrincipal(params Claim[] claims)
        => new(new ClaimsIdentity(claims, authenticationType: "Test", nameType: ClaimTypes.Name, roleType: ClaimTypes.Role));

    [Fact]
    public void GetTenantId_ReturnsParsedValue()
    {
        var user = BuildPrincipal(new Claim("TenantId", "42"));

        user.GetTenantId().Should().Be(42);
    }

    [Fact]
    public void GetTenantId_ReturnsNull_WhenMissing()
    {
        var user = BuildPrincipal();

        user.GetTenantId().Should().BeNull();
    }

    [Fact]
    public void GetTenantId_ReturnsNull_WhenNotAnInteger()
    {
        var user = BuildPrincipal(new Claim("TenantId", "not-a-number"));

        user.GetTenantId().Should().BeNull();
    }

    [Fact]
    public void GetUserId_ReturnsParsedNameIdentifier()
    {
        var user = BuildPrincipal(new Claim(ClaimTypes.NameIdentifier, "7"));

        user.GetUserId().Should().Be(7);
    }

    [Fact]
    public void GetUserId_ReturnsNull_WhenMissing()
    {
        var user = BuildPrincipal();

        user.GetUserId().Should().BeNull();
    }

    [Fact]
    public void IsSystemAdmin_ReturnsTrue_WhenInRole()
    {
        var user = BuildPrincipal(new Claim(ClaimTypes.Role, "SystemAdmin"));

        user.IsSystemAdmin().Should().BeTrue();
    }

    [Fact]
    public void IsSystemAdmin_ReturnsFalse_WhenNotInRole()
    {
        var user = BuildPrincipal(new Claim(ClaimTypes.Role, "TenantAdmin"));

        user.IsSystemAdmin().Should().BeFalse();
    }
}
