#r "nuget: BCrypt.Net-Next, 4.0.3"
using BCrypt.Net;

var password = "test123";
var hash = BCrypt.HashPassword(password);
Console.WriteLine($"BCrypt hash for '{password}': {hash}");

// Verify it works
var isValid = BCrypt.Verify(password, hash);
Console.WriteLine($"Verification: {isValid}");
