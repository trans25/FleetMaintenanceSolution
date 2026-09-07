namespace Fleet.Core.Storage;

/// <summary>
/// Abstraction over document/blob storage. The current implementation is a
/// local file-system store (no cloud dependency). It can later be swapped for
/// an Azure Blob implementation without changing callers.
/// </summary>
public interface IFileStorage
{
    /// <summary>
    /// Persists the given content and returns a storage key that can be used
    /// to retrieve or delete the file later.
    /// </summary>
    Task<string> SaveAsync(string fileName, Stream content, CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens a readable stream for the file identified by <paramref name="storageKey"/>,
    /// or null if it does not exist.
    /// </summary>
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes the file identified by <paramref name="storageKey"/> if it exists.
    /// </summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}
