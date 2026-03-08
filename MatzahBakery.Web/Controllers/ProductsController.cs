using MatzahBakery.Data;
using MatzahBakery.Data.Repositories.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ProductsRepository _repository;

        public ProductsController(ProductsRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            var products = await _repository.GetAllProductsWithTypesAsync();

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

            var product = await _repository.CreateProductAsync(request.ProductName.Trim(), request.ProductPrice);

            return CreatedAtAction(nameof(GetAll), ToDto(product));
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> DeleteProduct(int productId)
        {
            var deleted = await _repository.DeleteProductAsync(productId);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpPut("{productId}")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int productId, [FromBody] UpdateProductRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductName))
            {
                return BadRequest(new { message = "productName is required." });
            }

            var product = await _repository.UpdateProductAsync(productId, request.ProductName.Trim(), request.ProductPrice);
            if (product == null)
            {
                return NotFound();
            }

            return Ok(ToDto(product));
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

            var result = await _repository.AddProductTypeToProductAsync(
                productId,
                request.ProductTypeId,
                request.ProductTypeName,
                request.TypePrice);

            if (result.Status == AddProductTypeToProductStatus.ProductNotFound)
            {
                return NotFound(new { message = "Product not found." });
            }

            if (result.Status == AddProductTypeToProductStatus.ProductTypeNotFound)
            {
                return NotFound(new { message = "Product type not found." });
            }

            if (result.Status == AddProductTypeToProductStatus.AlreadyLinked)
            {
                return BadRequest(new { message = "This type is already linked to the product." });
            }

            return CreatedAtAction(nameof(GetAll), new ProductTypeDto
            {
                ProductTypeId = result.ProductTypeId,
                ProductTypeName = result.ProductTypeName,
                TypePrice = result.TypePrice
            });
        }

        [HttpDelete("{productId}/types/{productTypeId}")]
        public async Task<IActionResult> DeleteType(int productId, int productTypeId)
        {
            var deleted = await _repository.DeleteTypeFromProductAsync(productId, productTypeId);
            if (!deleted)
            {
                return NotFound();
            }
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

            var result = await _repository.UpdateTypeInProductAsync(
                productId,
                productTypeId,
                request.ProductTypeName.Trim(),
                request.TypePrice);

            if (result.Status == UpdateTypeInProductStatus.LinkNotFound)
            {
                return NotFound();
            }

            if (result.Status == UpdateTypeInProductStatus.ProductTypeNotFound)
            {
                return NotFound(new { message = "Product type not found." });
            }

            return Ok(new ProductTypeDto
            {
                ProductTypeId = result.ProductTypeId,
                ProductTypeName = result.ProductTypeName,
                TypePrice = result.TypePrice
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
