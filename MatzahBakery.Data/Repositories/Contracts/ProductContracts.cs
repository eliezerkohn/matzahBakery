namespace MatzahBakery.Data.Repositories.Contracts;

// Tag: Add Product Type Link Status
public enum AddProductTypeToProductStatus
{
    ProductNotFound,
    ProductTypeNotFound,
    AlreadyLinked,
    Created
}

// Tag: Add Product Type Link Result
public class AddProductTypeToProductResult
{
    public AddProductTypeToProductStatus Status { get; set; }
    public int ProductTypeId { get; set; }
    public string ProductTypeName { get; set; } = string.Empty;
    public decimal TypePrice { get; set; }
}

// Tag: Update Product Type Link Status
public enum UpdateTypeInProductStatus
{
    LinkNotFound,
    ProductTypeNotFound,
    Updated
}

// Tag: Update Product Type Link Result
public class UpdateTypeInProductResult
{
    public UpdateTypeInProductStatus Status { get; set; }
    public int ProductTypeId { get; set; }
    public string ProductTypeName { get; set; } = string.Empty;
    public decimal TypePrice { get; set; }
}
