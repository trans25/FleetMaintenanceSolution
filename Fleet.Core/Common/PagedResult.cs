namespace Fleet.Core.Common;

/// <summary>
/// Generic paged result wrapper returned by list endpoints.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;

    public PagedResult() { }

    public PagedResult(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }

    public static PagedResult<T> Create(IEnumerable<T> source, int page, int pageSize)
    {
        var list = source as IReadOnlyList<T> ?? source.ToList();
        var total = list.Count;
        var items = list.Skip((page < 1 ? 0 : page - 1) * pageSize).Take(pageSize).ToList();
        return new PagedResult<T>(items, total, page, pageSize);
    }
}
