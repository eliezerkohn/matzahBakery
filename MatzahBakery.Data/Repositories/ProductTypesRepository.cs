using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Data;

// Tag: Product Type Repository
public class ProductTypesRepository
{
    private readonly MatzahBakeryDataContext _context;

    public ProductTypesRepository(MatzahBakeryDataContext context)
    {
        _context = context;
    }

    // Tag: Read Product Types
    public async Task<List<ProductType>> GetAllProductTypesAsync()
    {
        return await _context.productTypes
            .AsNoTracking()
            .OrderBy(type => ((type.TypeName ?? string.Empty).ToLower() == "regular") ? 0 : 1)
            .ThenBy(type => type.TypeName)
            .ThenBy(type => type.ProductTypeId)
            .ToListAsync();
    }

    // Tag: Create Product Type
    public async Task<ProductType> CreateProductTypeAsync(string productTypeName)
    {
        var type = new ProductType
        {
            TypeName = productTypeName
        };

        _context.productTypes.Add(type);
        await _context.SaveChangesAsync();
        return type;
    }

    // Tag: Delete Product Type And Links
    public async Task<bool> DeleteProductTypeAsync(int productTypeId)
    {
        var type = await _context.productTypes.FirstOrDefaultAsync(item => item.ProductTypeId == productTypeId);
        if (type == null)
        {
            return false;
        }

        var links = await _context.productToProductTypes
            .Where(link => link.ProductTypeId == productTypeId)
            .ToListAsync();

        _context.productToProductTypes.RemoveRange(links);
        _context.productTypes.Remove(type);
        await _context.SaveChangesAsync();
        return true;
    }

    // Tag: Update Product Type Name
    public async Task<ProductType> UpdateProductTypeAsync(int productTypeId, string productTypeName)
    {
        var type = await _context.productTypes.FirstOrDefaultAsync(item => item.ProductTypeId == productTypeId);
        if (type == null)
        {
            return null;
        }

        type.TypeName = productTypeName;
        await _context.SaveChangesAsync();
        return type;
    }
}
