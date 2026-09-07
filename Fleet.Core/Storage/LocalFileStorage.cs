using Microsoft.Extensions.Options;

namespace Fleet.Core.Storage;

/// <summary>
/// Local file-system implementation of <see cref="IFileStorage"/>. Stores files
/// under a configurable root directory. No cloud dependency.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(IOptions<FileStorageOptions> options)
    {
        var configured = options.Value.RootPath;
        _rootPath = Path.IsPathRooted(configured)
            ? configured
            : Path.Combine(AppContext.BaseDirectory, configured);

        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(string fileName, Stream content, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        var storageKey = $"{Guid.NewGuid():N}{extension}";
        var fullPath = GetFullPath(storageKey);

        await using var target = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(target, cancellationToken);

        return storageKey;
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(storageKey);
        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(storageKey);
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    private string GetFullPath(string storageKey)
    {
        // Prevent path traversal by using only the file name portion of the key.
        var safeKey = Path.GetFileName(storageKey);
        return Path.Combine(_rootPath, safeKey);
    }
}
