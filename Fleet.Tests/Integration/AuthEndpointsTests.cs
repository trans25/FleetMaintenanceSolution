using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Integration;

public class AuthEndpointsTests : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory;

    public AuthEndpointsTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient()
        => _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

    private static object BuildOnboard(string username, string email, string password, string company) => new
    {
        CompanyName = company,
        ContactPhone = "0123456789",
        FirstName = "Test",
        LastName = "User",
        Username = username,
        WorkEmail = email,
        Password = password,
        ConfirmPassword = password
    };

    [Fact]
    public async Task Onboard_CreatesTenantAndFirstAdmin()
    {
        // Uses an isolated factory (fresh InMemory DB) so onboarding is genuinely
        // the first tenant/admin created for this store.
        using var factory = new AuthApiFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var response = await client.PostAsJsonAsync(
            "/api/auth/onboard",
            BuildOnboard("admin", "admin@test.local", "Password1!", "Acme Fleets"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("tenantId").GetInt32().Should().BeGreaterThan(0);
        payload.GetProperty("userId").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Onboard_DuplicateUsername_ReturnsConflict()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/onboard",
            BuildOnboard("dupuser", "dup1@test.local", "Password1!", "Dup Co One"));

        var second = await client.PostAsJsonAsync("/api/auth/onboard",
            BuildOnboard("dupuser", "dup2@test.local", "Password1!", "Dup Co Two"));

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsAccessAndRefreshTokens()
    {
        using var factory = new AuthApiFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        await client.PostAsJsonAsync("/api/auth/onboard",
            BuildOnboard("loginuser", "login@test.local", "Password1!", "Login Co"));

        // Onboarded accounts start inactive; simulate email verification.
        factory.VerifyUserEmail("login@test.local").Should().BeTrue();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Username = "loginuser",
            Password = "Password1!"
        });

        login.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await login.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("token").GetString().Should().NotBeNullOrWhiteSpace();
        payload.GetProperty("refreshToken").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        using var factory = new AuthApiFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        await client.PostAsJsonAsync("/api/auth/onboard",
            BuildOnboard("wrongpw", "wrongpw@test.local", "Password1!", "Wrong Pw Co"));
        factory.VerifyUserEmail("wrongpw@test.local").Should().BeTrue();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Username = "wrongpw",
            Password = "NotThePassword!"
        });

        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_WithUnknownToken_ReturnsUnauthorizedOrBadRequest()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new
        {
            RefreshToken = "this-token-does-not-exist"
        });

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Health_Endpoint_ReturnsSuccess()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/health");

        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, because: body);
    }
}
