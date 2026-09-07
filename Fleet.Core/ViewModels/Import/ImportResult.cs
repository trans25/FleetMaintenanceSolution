namespace Fleet.Core.ViewModels.Import;

/// <summary>
/// Per-row outcome of a bulk import operation.
/// </summary>
public class ImportRowResult
{
    public int RowNumber { get; set; }
    public bool Success { get; set; }
    public string? Identifier { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Aggregate result of a CSV bulk import (fleets, vehicles, etc.).
/// </summary>
public class ImportResult
{
    public int TotalRows { get; set; }
    public int Imported { get; set; }
    public int Failed { get; set; }
    public List<ImportRowResult> Rows { get; set; } = new();
}
