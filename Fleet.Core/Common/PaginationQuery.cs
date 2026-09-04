namespace Fleet.Core.Common;

/// <summary>
/// Standard pagination request parameters bound from the query string.
/// </summary>
public class PaginationQuery
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int Page { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value is <= 0 ? 20 : (value > MaxPageSize ? MaxPageSize : value);
    }

    public int Skip => (Page < 1 ? 0 : Page - 1) * PageSize;
}
