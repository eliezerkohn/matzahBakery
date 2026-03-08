using Microsoft.EntityFrameworkCore;
using MatzahBakery.Data.Repositories.Contracts;

namespace MatzahBakery.Data;

// Tag: Product Repository
public class ProductsRepository
{
    private readonly MatzahBakeryDataContext _context;

    public ProductsRepository(MatzahBakeryDataContext context)
    {
        _context = context;
    }

    // Tag: Read Products With Types
    public async Task<List<Product>> GetAllProductsWithTypesAsync()
    {
        var products = await _context.products
            .AsNoTracking()
            .Include(p => p.productToProductTypes)
            .ThenInclude(link => link.ProductType)
            .ToListAsync();

        return ApplyDisplayOrdering(products);
    }

    // Tag: Create Product
    public async Task<Product> CreateProductAsync(string productName, decimal productPrice)
    {
        var product = new Product
        {
            ProductName = productName,
            Price = productPrice
        };

        _context.products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    // Tag: Update Product
    public async Task<Product> UpdateProductAsync(int productId, string productName, decimal productPrice)
    {
        var product = await _context.products.FirstOrDefaultAsync(item => item.ProductId == productId);
        if (product == null)
        {
            return null;
        }

        product.ProductName = productName;
        product.Price = productPrice;
        await _context.SaveChangesAsync();

        var updatedProduct = await _context.products
            .AsNoTracking()
            .Include(p => p.productToProductTypes)
            .ThenInclude(link => link.ProductType)
            .FirstOrDefaultAsync(item => item.ProductId == productId);

        return updatedProduct == null
            ? null
            : ApplyDisplayOrdering(new List<Product> { updatedProduct }).FirstOrDefault();
    }

    // Tag: Display Ordering Rules
    private static List<Product> ApplyDisplayOrdering(List<Product> products)
    {
        foreach (var product in products)
        {
            product.productToProductTypes = (product.productToProductTypes ?? new List<ProductToProductType>())
                .OrderBy(link => GetDisplayPriority(link?.ProductType?.TypeName))
                .ThenBy(link => link?.ProductType?.TypeName)
                .ThenBy(link => link.ProductTypeId)
                .ToList();
        }

        return products
            .OrderBy(product => GetDisplayPriority(product.ProductName))
            .ThenBy(product => product.ProductName)
            .ThenBy(product => product.ProductId)
            .ToList();
    }

    private static int GetDisplayPriority(string name)
    {
        return string.Equals((name ?? string.Empty).Trim(), "Regular", StringComparison.OrdinalIgnoreCase)
            ? 0
            : 1;
    }

    // Tag: Delete Product And Links
    public async Task<bool> DeleteProductAsync(int productId)
    {
        var product = await _context.products.FirstOrDefaultAsync(p => p.ProductId == productId);
        if (product == null)
        {
            return false;
        }

        var links = await _context.productToProductTypes
            .Where(link => link.ProductId == productId)
            .ToListAsync();

        _context.productToProductTypes.RemoveRange(links);
        _context.products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    // Tag: Add Type To Product
    public async Task<AddProductTypeToProductResult> AddProductTypeToProductAsync(
        int productId,
        int? productTypeId,
        string productTypeName,
        decimal typePrice)
    {
        var productExists = await _context.products.AnyAsync(p => p.ProductId == productId);
        if (!productExists)
        {
            return new AddProductTypeToProductResult
            {
                Status = AddProductTypeToProductStatus.ProductNotFound
            };
        }

        ProductType productType;
        if (productTypeId.HasValue)
        {
            productType = await _context.productTypes
                .FirstOrDefaultAsync(item => item.ProductTypeId == productTypeId.Value);
        }
        else
        {
            var requestedName = (productTypeName ?? string.Empty).Trim();
            productType = await _context.productTypes
                .FirstOrDefaultAsync(item => item.TypeName.ToLower() == requestedName.ToLower());

            if (productType == null)
            {
                productType = new ProductType
                {
                    TypeName = requestedName
                };

                _context.productTypes.Add(productType);
                await _context.SaveChangesAsync();
            }
        }

        if (productType == null)
        {
            return new AddProductTypeToProductResult
            {
                Status = AddProductTypeToProductStatus.ProductTypeNotFound
            };
        }

        var existingLink = await _context.productToProductTypes
            .AnyAsync(item => item.ProductId == productId && item.ProductTypeId == productType.ProductTypeId);

        if (existingLink)
        {
            return new AddProductTypeToProductResult
            {
                Status = AddProductTypeToProductStatus.AlreadyLinked
            };
        }

        var link = new ProductToProductType
        {
            ProductToProdutTypeID = (await _context.productToProductTypes
                .Select(item => (int?)item.ProductToProdutTypeID)
                .MaxAsync() ?? 0) + 1,
            ProductId = productId,
            ProductTypeId = productType.ProductTypeId,
            Price = typePrice
        };

        _context.productToProductTypes.Add(link);
        await _context.SaveChangesAsync();

        return new AddProductTypeToProductResult
        {
            Status = AddProductTypeToProductStatus.Created,
            ProductTypeId = productType.ProductTypeId,
            ProductTypeName = productType.TypeName,
            TypePrice = link.Price
        };
    }

    // Tag: Delete Type Link From Product
    public async Task<DeleteTypeFromProductStatus> DeleteTypeFromProductAsync(int productId, int productTypeId)
    {
        var link = await _context.productToProductTypes
            .FirstOrDefaultAsync(item => item.ProductId == productId && item.ProductTypeId == productTypeId);

        if (link == null)
        {
            return DeleteTypeFromProductStatus.NotFound;
        }

        var isUsedByOrderItems = await _context.orderItems
            .AsNoTracking()
            .AnyAsync(item => item.ProductToProductTypeID == link.ProductToProdutTypeID);

        if (isUsedByOrderItems)
        {
            return DeleteTypeFromProductStatus.InUseByOrders;
        }

        _context.productToProductTypes.Remove(link);
        await _context.SaveChangesAsync();
        return DeleteTypeFromProductStatus.Deleted;
    }

    // Tag: Update Type Link In Product
    public async Task<UpdateTypeInProductResult> UpdateTypeInProductAsync(
        int productId,
        int productTypeId,
        string productTypeName,
        decimal typePrice)
    {
        var link = await _context.productToProductTypes
            .Include(item => item.ProductType)
            .FirstOrDefaultAsync(item => item.ProductId == productId && item.ProductTypeId == productTypeId);

        if (link == null)
        {
            return new UpdateTypeInProductResult
            {
                Status = UpdateTypeInProductStatus.LinkNotFound
            };
        }

        if (link.ProductType == null)
        {
            return new UpdateTypeInProductResult
            {
                Status = UpdateTypeInProductStatus.ProductTypeNotFound
            };
        }

        link.ProductType.TypeName = productTypeName;
        link.Price = typePrice;
        await _context.SaveChangesAsync();

        return new UpdateTypeInProductResult
        {
            Status = UpdateTypeInProductStatus.Updated,
            ProductTypeId = link.ProductTypeId,
            ProductTypeName = link.ProductType.TypeName,
            TypePrice = link.Price
        };
    }
}
