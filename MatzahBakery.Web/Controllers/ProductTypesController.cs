using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/product-types")]
    [ApiController]
    public class ProductTypesController : ControllerBase
    {
        private readonly ProductTypesRepository _repository;

        public ProductTypesController(ProductTypesRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductTypeDto>>> GetAll()
        {
            var types = await _repository.GetAllProductTypesAsync();

            return Ok(types.Select(ToDto));
        }

        [HttpPost]
        public async Task<ActionResult<ProductTypeDto>> Create([FromBody] CreateProductTypeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeName is required." });
            }

            var type = await _repository.CreateProductTypeAsync(request.ProductTypeName.Trim());

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
            var deleted = await _repository.DeleteProductTypeAsync(productTypeId);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpPut("{productTypeId}")]
        public async Task<ActionResult<ProductTypeDto>> Update(int productTypeId, [FromBody] UpdateProductTypeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductTypeName))
            {
                return BadRequest(new { message = "productTypeName is required." });
            }

            var type = await _repository.UpdateProductTypeAsync(productTypeId, request.ProductTypeName.Trim());
            if (type == null)
            {
                return NotFound();
            }

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
        }

        public class ProductTypeDto
        {
            public int ProductTypeId { get; set; }
            public string ProductTypeName { get; set; } = string.Empty;
            public decimal TypePrice { get; set; }
        }
    }
}
