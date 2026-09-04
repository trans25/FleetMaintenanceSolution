namespace Fleet.Core.Security;

/// <summary>
/// Centralized password hashing/verification using BCrypt so all services
/// share one consistent, secure implementation.
/// </summary>
public static class PasswordHasher
{
    public static string Hash(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Password cannot be null or empty.", nameof(password));

        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public static bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(passwordHash))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Hash is not a valid BCrypt hash (e.g. legacy plaintext) - treat as failed.
            return false;
        }
    }
}
