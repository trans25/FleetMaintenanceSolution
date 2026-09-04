using Fleet.Core.Data;
using Fleet.Core.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Fleet.Tests.Services;

public class TokenStoreServiceTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateRefreshTokenAsync_PersistsActiveToken()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);

        var token = await service.CreateRefreshTokenAsync(userId: 1, lifetime: TimeSpan.FromDays(7));

        token.Token.Should().NotBeNullOrWhiteSpace();
        token.IsActive.Should().BeTrue();
        (await service.GetRefreshTokenAsync(token.Token)).Should().NotBeNull();
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_MarksTokenInactive()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);
        var token = await service.CreateRefreshTokenAsync(userId: 1, lifetime: TimeSpan.FromDays(7));

        await service.RevokeRefreshTokenAsync(token, replacedByToken: "next-token");

        token.RevokedAt.Should().NotBeNull();
        token.ReplacedByToken.Should().Be("next-token");
        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_RevokesOnlyTargetUsersActiveTokens()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);
        var userAToken1 = await service.CreateRefreshTokenAsync(userId: 1, lifetime: TimeSpan.FromDays(7));
        var userAToken2 = await service.CreateRefreshTokenAsync(userId: 1, lifetime: TimeSpan.FromDays(7));
        var userBToken = await service.CreateRefreshTokenAsync(userId: 2, lifetime: TimeSpan.FromDays(7));

        await service.RevokeAllUserRefreshTokensAsync(userId: 1);

        (await service.GetRefreshTokenAsync(userAToken1.Token))!.IsActive.Should().BeFalse();
        (await service.GetRefreshTokenAsync(userAToken2.Token))!.IsActive.Should().BeFalse();
        (await service.GetRefreshTokenAsync(userBToken.Token))!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetRefreshTokenAsync_ReturnsNull_ForUnknownToken()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);

        (await service.GetRefreshTokenAsync("does-not-exist")).Should().BeNull();
    }

    [Fact]
    public async Task CreatePasswordResetTokenAsync_PersistsActiveToken()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);

        var token = await service.CreatePasswordResetTokenAsync(userId: 5, lifetime: TimeSpan.FromHours(1));

        token.Token.Should().NotBeNullOrWhiteSpace();
        token.IsActive.Should().BeTrue();
        (await service.GetPasswordResetTokenAsync(token.Token)).Should().NotBeNull();
    }

    [Fact]
    public async Task MarkPasswordResetTokenUsedAsync_MakesTokenInactive()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);
        var token = await service.CreatePasswordResetTokenAsync(userId: 5, lifetime: TimeSpan.FromHours(1));

        await service.MarkPasswordResetTokenUsedAsync(token);

        token.UsedAt.Should().NotBeNull();
        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task CreatePasswordResetTokenAsync_ExpiredLifetime_ProducesInactiveToken()
    {
        using var context = CreateContext();
        var service = new TokenStoreService(context);

        var token = await service.CreatePasswordResetTokenAsync(userId: 5, lifetime: TimeSpan.FromHours(-1));

        token.IsActive.Should().BeFalse();
    }
}
