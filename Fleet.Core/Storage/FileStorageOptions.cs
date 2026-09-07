namespace Fleet.Core.Storage;

/// <summary>
/// Configurable options for <see cref="LocalFileStorage"/>. Bound from the
/// "FileStorage" appsettings section.
/// </summary>
public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    /// <summary>
    /// Root directory where files are stored. Relative paths are resolved
    /// against the application base directory. Defaults to "App_Data/compliance".
    /// </summary>
    public string RootPath { get; set; } = "App_Data/compliance";
}
