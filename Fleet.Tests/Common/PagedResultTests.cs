using Fleet.Core.Common;
using FluentAssertions;
using Xunit;

namespace Fleet.Tests.Common;

public class PagedResultTests
{
    [Fact]
    public void Create_ReturnsRequestedPageSlice()
    {
        var source = Enumerable.Range(1, 25).ToList();

        var result = PagedResult<int>.Create(source, page: 2, pageSize: 10);

        result.Items.Should().HaveCount(10);
        result.Items.First().Should().Be(11);
        result.Items.Last().Should().Be(20);
        result.TotalCount.Should().Be(25);
        result.Page.Should().Be(2);
        result.PageSize.Should().Be(10);
    }

    [Fact]
    public void Create_ComputesTotalPagesAndNavigationFlags()
    {
        var source = Enumerable.Range(1, 25).ToList();

        var result = PagedResult<int>.Create(source, page: 2, pageSize: 10);

        result.TotalPages.Should().Be(3);
        result.HasPrevious.Should().BeTrue();
        result.HasNext.Should().BeTrue();
    }

    [Fact]
    public void Create_FirstPage_HasNoPrevious()
    {
        var result = PagedResult<int>.Create(Enumerable.Range(1, 5), page: 1, pageSize: 10);

        result.HasPrevious.Should().BeFalse();
        result.HasNext.Should().BeFalse();
        result.TotalPages.Should().Be(1);
    }

    [Fact]
    public void Create_LastPage_HasNoNext()
    {
        var result = PagedResult<int>.Create(Enumerable.Range(1, 25), page: 3, pageSize: 10);

        result.Items.Should().HaveCount(5);
        result.HasNext.Should().BeFalse();
        result.HasPrevious.Should().BeTrue();
    }
}
