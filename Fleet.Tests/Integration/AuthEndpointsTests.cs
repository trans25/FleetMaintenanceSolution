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

    private static object BuildRegister(string username, string email, string password) => new
    {
        Username = username,
        Email = email,
        Password = password,
        ConfirmPassword = password,
        FirstName = "Test",
        LastName = "User",
        TenantId = 1
    };

    [Fact]
    public async Task Register_FirstUser_BecomesSystemAdmin()
    {
        // Uses an isolated factory (fresh InMemory DB) so this user is genuinely
        // the first user and receives the SystemAdmin bootstrap role.
        using var factory = new AuthApiFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            BuildRegister("admin", "admin@test.local", "Password1!"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("isSystemAdmin").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsConflict()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register",
            BuildRegister("dupuser", "dup1@test.local", "Password1!"));

        var second = await client.PostAsJsonAsync("/api/auth/register",
            BuildRegister("dupuser", "dup2@test.local", "Password1!"));

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsAccessAndRefreshTokens()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register",
            BuildRegister("loginuser", "login@test.local", "Password1!"));

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
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register",
            BuildRegister("wrongpw", "wrongpw@test.local", "Password1!"));

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
