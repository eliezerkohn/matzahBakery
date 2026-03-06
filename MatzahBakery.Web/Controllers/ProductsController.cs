using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly MatzahBakeryDataContext _context;

        public ProductsController(MatzahBakeryDataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            var products = await _context.products
                .AsNoTracking()
                .Include(p => p.productToProductTypes)
                .ThenInclude(link => link.ProductType)
                .OrderBy(p => p.ProductId)
                .ToListAsync();

            return Ok(products.Select(ToDto));
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.ProductName))
            {
                return BadRequest(new { message = "productName is required." });
            }

            var product = new Product
            {
                ProductName = request.ProductName.Trim(),
                Price = request.ProductPrice
            };

            _context.products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), ToDto(product));
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> DeleteProduct(int productId)
        {
            var product = await _context.products.FirstOrDefaultAsync(p => p.ProductId == productId);
            if (product == null)
            {
                return NotFound();
            }

            var links = await _context.productToProductTypes
                .Where(link => link.ProductId == productId)
                .ToListAsync();

            _context.productToProductTypes.RemoveRange(links);
            _context.products.Remove(product);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{productId}")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int productId, [FromBody] UpdateProductRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductName))
            {
                return BadRequest(new { message = "productName is required." });
            }

            var product = await _context.products.FirstOrDefaultAsync(item => item.ProductId == productId);
            if (product == null)
            {
                return NotFound();
            }

            product.ProductName = request.ProductName.Trim();
            product.Price = request.ProductPrice;
            await _context.SaveChangesAsync();

            var updatedProduct = await _context.products
                .AsNoTracking()
                .Include(p => p.productToProductTypes)
                .ThenInclude(link => link.ProductType)
                .FirstOrDefaultAsync(item => item.ProductId == productId);

            if (updatedProduct == null)
            {
                return NotFound();
            }

            return Ok(ToDto(updatedProduct));
        }

        [HttpPost("{productId}/types")]
        public async Task<ActionResult<ProductTypeDto>> CreateType(int productId, [FromBody] CreateProductTypeRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required." });
            }

            if (!request.ProductTypeId.HasValue && string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeId or productTypeName is required." });
            }

            var product = await _context.products.FirstOrDefaultAsync(p => p.ProductId == productId);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            ProductType? productType = null;

            if (request.ProductTypeId.HasValue)
            {
                productType = await _context.productTypes
                    .FirstOrDefaultAsync(item => item.ProductTypeId == request.ProductTypeId.Value);
            }
            else
            {
                var requestedName = request.ProductTypeName.Trim();
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
                return NotFound(new { message = "Product type not found." });
            }

            var existingLink = await _context.productToProductTypes
                .AnyAsync(item => item.ProductId == productId && item.ProductTypeId == productType.ProductTypeId);

            if (existingLink)
            {
                return BadRequest(new { message = "This type is already linked to the product." });
            }

            var link = new ProductToProductType
            {
                ProductToProdutTypeID = (await _context.productToProductTypes
                    .Select(item => (int?)item.ProductToProdutTypeID)
                    .MaxAsync() ?? 0) + 1,
                ProductId = productId,
                ProductTypeId = productType.ProductTypeId,
                Price = request.TypePrice
            };

            _context.productToProductTypes.Add(link);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new ProductTypeDto
            {
                ProductTypeId = productType.ProductTypeId,
                ProductTypeName = productType.TypeName,
                TypePrice = link.Price
            });
        }

        [HttpDelete("{productId}/types/{productTypeId}")]
        public async Task<IActionResult> DeleteType(int productId, int productTypeId)
        {
            var link = await _context.productToProductTypes
                .FirstOrDefaultAsync(item => item.ProductId == productId && item.ProductTypeId == productTypeId);

            if (link == null)
            {
                return NotFound();
            }

            _context.productToProductTypes.Remove(link);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{productId}/types/{productTypeId}")]
        public async Task<ActionResult<ProductTypeDto>> UpdateType(
            int productId,
            int productTypeId,
            [FromBody] UpdateProductTypeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeName is required." });
            }

            var link = await _context.productToProductTypes
                .Include(item => item.ProductType)
                .FirstOrDefaultAsync(item => item.ProductId == productId && item.ProductTypeId == productTypeId);

            if (link == null)
            {
                return NotFound();
            }

            if (link.ProductType == null)
            {
                return NotFound(new { message = "Product type not found." });
            }

            link.ProductType.TypeName = request.ProductTypeName.Trim();
            link.Price = request.TypePrice;
            await _context.SaveChangesAsync();

            return Ok(new ProductTypeDto
            {
                ProductTypeId = link.ProductTypeId,
                ProductTypeName = link.ProductType.TypeName,
                TypePrice = link.Price
            });
        }

        private static ProductDto ToDto(Product product)
        {
            return new ProductDto
            {
                ProductId = product.ProductId,
                ProductName = product.ProductName,
                ProductPrice = product.Price,
                Types = (product.productToProductTypes ?? new List<ProductToProductType>())
                    .Select(link => new ProductTypeDto
                    {
                        ProductTypeId = link.ProductTypeId,
                        ProductTypeName = link.ProductType?.TypeName ?? string.Empty,
                        TypePrice = link.Price
                    })
                    .OrderBy(type => type.ProductTypeId)
                    .ToList()
            };
        }

        public class CreateProductRequest
        {
            public string ProductId { get; set; } = string.Empty;
            public string ProductName { get; set; } = string.Empty;
            public decimal ProductPrice { get; set; }
        }

        public class UpdateProductRequest
        {
            public string ProductName { get; set; } = string.Empty;
            public decimal ProductPrice { get; set; }
        }

        public class CreateProductTypeRequest
        {
            public int? ProductTypeId { get; set; }
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }

        public class UpdateProductTypeRequest
        {
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }

        public class ProductDto
        {
            public int ProductId { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public decimal ProductPrice { get; set; }
            public List<ProductTypeDto> Types { get; set; } = new();
        }

        public class ProductTypeDto
        {
            public int ProductTypeId { get; set; }
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }
    }
}
