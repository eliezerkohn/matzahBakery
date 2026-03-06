using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/product-types")]
    [ApiController]
    public class ProductTypesController : ControllerBase
    {
        private readonly MatzahBakeryDataContext _context;

        public ProductTypesController(MatzahBakeryDataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductTypeDto>>> GetAll()
        {
            var types = await _context.productTypes
                .AsNoTracking()
                .OrderBy(type => type.ProductTypeId)
                .ToListAsync();

            return Ok(types.Select(ToDto));
        }

        [HttpPost]
        public async Task<ActionResult<ProductTypeDto>> Create([FromBody] CreateProductTypeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeName is required." });
            }

            var type = new ProductType
            {
                TypeName = request.ProductTypeName.Trim()
            };

            _context.productTypes.Add(type);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new ProductTypeDto
            {
                ProductTypeId = type.ProductTypeId,
                ProductTypeName = type.TypeName,
                TypePrice = 0
            });
        }

        [HttpDelete("{productTypeId}")]
        public async Task<IActionResult> Delete(int productTypeId)
        {
            var type = await _context.productTypes.FirstOrDefaultAsync(item => item.ProductTypeId == productTypeId);
            if (type == null)
            {
                return NotFound();
            }

            var links = await _context.productToProductTypes
                .Where(link => link.ProductTypeId == productTypeId)
                .ToListAsync();

            _context.productToProductTypes.RemoveRange(links);
            _context.productTypes.Remove(type);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{productTypeId}")]
        public async Task<ActionResult<ProductTypeDto>> Update(int productTypeId, [FromBody] UpdateProductTypeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeName is required." });
            }

            var type = await _context.productTypes.FirstOrDefaultAsync(item => item.ProductTypeId == productTypeId);
            if (type == null)
            {
                return NotFound();
            }

            type.TypeName = request.ProductTypeName.Trim();
            await _context.SaveChangesAsync();

            return Ok(ToDto(type));
        }

        private static ProductTypeDto ToDto(ProductType type)
        {
            return new ProductTypeDto
            {
                ProductTypeId = type.ProductTypeId,
                ProductTypeName = type.TypeName,
                TypePrice = 0
            };
        }

        public class CreateProductTypeRequest
        {
            public string ProductTypeName { get; set; } = string.Empty;
        }

        public class UpdateProductTypeRequest
        {
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }

        public class ProductTypeDto
        {
            public int ProductTypeId { get; set; }
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }
    }
}
