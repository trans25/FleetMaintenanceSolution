using Fleet.Core.Common;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Common;

public class PaginationQueryTests
{
    [Fact]
    public void Defaults_AreSensible()
    {
        var query = new PaginationQuery();

        query.Page.Should().Be(1);
        query.PageSize.Should().Be(20);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-5, 20)]
    [InlineData(50, 50)]
    [InlineData(100, 100)]
    [InlineData(500, 100)]
    public void PageSize_IsClamped(int input, int expected)
    {
        var query = new PaginationQuery { PageSize = input };

        query.PageSize.Should().Be(expected);
    }

    [Theory]
    [InlineData(1, 20, 0)]
    [InlineData(2, 20, 20)]
    [InlineData(3, 10, 20)]
    [InlineData(0, 20, 0)]
    public void Skip_IsCalculatedFromPageAndPageSize(int page, int pageSize, int expectedSkip)
    {
        var query = new PaginationQuery { Page = page, PageSize = pageSize };

        query.Skip.Should().Be(expectedSkip);
    }
}
