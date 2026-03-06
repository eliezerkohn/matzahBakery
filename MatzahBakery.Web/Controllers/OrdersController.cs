using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly MatzahBakeryDataContext _context;
        private const decimal DeliveryFee = 25m;

        public OrdersController(MatzahBakeryDataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
        {
            var orders = await _context.orders
                .AsNoTracking()
                .Include(order => order.Customer)
                .OrderByDescending(order => order.OrderDate)
                .ThenByDescending(order => order.OrderId)
                .ToListAsync();

            if (!orders.Any())
            {
                return Ok(new List<OrderDto>());
            }

            var orderIds = orders.Select(order => order.OrderId).ToList();
            var orderItems = await _context.orderItems
                .AsNoTracking()
                .Where(item => orderIds.Contains(item.OrderID))
                .ToListAsync();

            var productTypeLinkIds = orderItems
                .Select(item => item.ProductToProductTypeID)
                .Distinct()
                .ToList();

            var productTypeLinks = await _context.productToProductTypes
                .AsNoTracking()
                .Include(link => link.Product)
                .Include(link => link.ProductType)
                .Where(link => productTypeLinkIds.Contains(link.ProductToProdutTypeID))
                .ToListAsync();

            var linkLookup = productTypeLinks
                .GroupBy(link => link.ProductToProdutTypeID)
                .ToDictionary(group => group.Key, group => group.First());

            var itemsByOrder = orderItems
                .GroupBy(item => item.OrderID)
                .ToDictionary(group => group.Key, group => group.ToList());

            var result = orders.Select(order =>
            {
                var lines = itemsByOrder.TryGetValue(order.OrderId, out var items)
                    ? items.Select(item =>
                    {
                        var hasLink = linkLookup.TryGetValue(item.ProductToProductTypeID, out var link);
                        var basePrice = hasLink ? link?.Product?.Price ?? 0 : 0;
                        var typePrice = hasLink ? link?.Price ?? 0 : 0;
                        var unitPrice = basePrice + typePrice;

                        return new OrderItemDto
                        {
                            OrderItemId = item.OrderItemsID,
                            ProductId = hasLink ? link?.ProductId ?? 0 : 0,
                            ProductName = hasLink ? link?.Product?.ProductName ?? string.Empty : string.Empty,
                            ProductTypeId = hasLink ? link?.ProductTypeId ?? 0 : 0,
                            ProductTypeName = hasLink ? link?.ProductType?.TypeName ?? string.Empty : string.Empty,
                            Quantity = item.Quantity,
                            UnitPrice = unitPrice,
                            LineTotal = unitPrice * item.Quantity
                        };
                    }).ToList()
                    : new List<OrderItemDto>();

                return new OrderDto
                {
                    OrderId = order.OrderId,
                    OrderDate = order.OrderDate,
                    IsDelivery = order.IsDelivery,
                    DeliveryDate = order.DeliveryDate,
                    DeliveryAddress = order.DeliveryAddress ?? string.Empty,
                    FulfillmentType = order.IsDelivery ? "delivery" : "pickup",
                    CustomerId = order.CustomerId,
                    CustomerName = order.Customer != null
                        ? $"{order.Customer.FirstName} {order.Customer.LastName}".Trim()
                        : string.Empty,
                    ItemCount = lines.Sum(line => line.Quantity),
                    SubTotal = lines.Sum(line => line.LineTotal),
                    DeliveryFee = order.IsDelivery ? DeliveryFee : 0,
                    OrderTotal = lines.Sum(line => line.LineTotal) + (order.IsDelivery ? DeliveryFee : 0),
                    Items = lines
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateOrderRequest request)
        {
            if (request == null || request.CustomerId <= 0)
            {
                return BadRequest(new { message = "customerId is required." });
            }

            if (request.OrderLines == null || !request.OrderLines.Any())
            {
                return BadRequest(new { message = "At least one order line is required." });
            }

            var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
            if (customer == null)
            {
                return BadRequest(new { message = "Customer does not exist." });
            }

            var isDelivery = string.Equals(request.FulfillmentType, "delivery", StringComparison.OrdinalIgnoreCase);
            var customerAddress = BuildCustomerAddress(customer);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var order = new Order
            {
                OrderDate = request.OrderDate ?? DateTime.UtcNow,
                CustomerId = request.CustomerId,
                IsDelivery = isDelivery,
                DeliveryDate = request.OrderDate ?? DateTime.UtcNow,
                DeliveryAddress = isDelivery
                    ? (!string.IsNullOrWhiteSpace(request.DeliveryAddress) ? request.DeliveryAddress.Trim() : customerAddress)
                    : string.Empty
            };

            _context.orders.Add(order);
            await _context.SaveChangesAsync();

            var normalizedLines = request.OrderLines
                .Where(line => line.Quantity > 0)
                .ToList();

            if (!normalizedLines.Any())
            {
                return BadRequest(new { message = "At least one order line must have quantity greater than 0." });
            }

            var orderItems = new List<OrderItems>();
            foreach (var line in normalizedLines)
            {
                var productTypeLink = await _context.productToProductTypes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(link =>
                        link.ProductId == line.ProductId &&
                        link.ProductTypeId == line.ProductTypeId);

                if (productTypeLink == null)
                {
                    return BadRequest(new
                    {
                        message = $"Invalid product/type combination for productId={line.ProductId}, productTypeId={line.ProductTypeId}."
                    });
                }

                orderItems.Add(new OrderItems
                {
                    OrderID = order.OrderId,
                    ProductToProductTypeID = productTypeLink.ProductToProdutTypeID,
                    Quantity = line.Quantity
                });
            }

            _context.orderItems.AddRange(orderItems);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { orderId = order.OrderId, orderItemsCreated = orderItems.Count });
        }

        [HttpPut("{orderId}")]
        public async Task<ActionResult> Update(int orderId, [FromBody] UpdateOrderRequest request)
        {
            if (request == null || request.CustomerId <= 0)
            {
                return BadRequest(new { message = "customerId is required." });
            }

            var order = await _context.orders.FirstOrDefaultAsync(item => item.OrderId == orderId);
            if (order == null)
            {
                return NotFound(new { message = "Order not found." });
            }

            var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
            if (customer == null)
            {
                return BadRequest(new { message = "Customer does not exist." });
            }

            var isDelivery = string.Equals(request.FulfillmentType, "delivery", StringComparison.OrdinalIgnoreCase);
            var customerAddress = BuildCustomerAddress(customer);

            order.OrderDate = request.OrderDate ?? order.OrderDate;
            order.IsDelivery = isDelivery;
            order.DeliveryDate = request.OrderDate ?? order.DeliveryDate;
            order.DeliveryAddress = isDelivery
                ? (!string.IsNullOrWhiteSpace(request.DeliveryAddress) ? request.DeliveryAddress.Trim() : customerAddress)
                : string.Empty;
            order.CustomerId = request.CustomerId;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order updated." });
        }

        [HttpDelete("{orderId}")]
        public async Task<ActionResult> Delete(int orderId)
        {
            var order = await _context.orders.FirstOrDefaultAsync(item => item.OrderId == orderId);
            if (order == null)
            {
                return NotFound(new { message = "Order not found." });
            }

            var relatedItems = await _context.orderItems
                .Where(item => item.OrderID == orderId)
                .ToListAsync();

            _context.orderItems.RemoveRange(relatedItems);
            _context.orders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order deleted." });
        }

        [HttpPut("{orderId}/items/{orderItemId}")]
        public async Task<ActionResult> UpdateOrderItem(int orderId, int orderItemId, [FromBody] UpdateOrderItemRequest request)
        {
            if (request == null || request.Quantity <= 0)
            {
                return BadRequest(new { message = "quantity must be greater than 0." });
            }

            var orderExists = await _context.orders.AnyAsync(item => item.OrderId == orderId);
            if (!orderExists)
            {
                return NotFound(new { message = "Order not found." });
            }

            var orderItem = await _context.orderItems
                .FirstOrDefaultAsync(item => item.OrderItemsID == orderItemId && item.OrderID == orderId);

            if (orderItem == null)
            {
                return NotFound(new { message = "Order item not found." });
            }

            orderItem.Quantity = request.Quantity;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order item updated." });
        }

        public class CreateOrderRequest
        {
            public string? OrderId { get; set; }
            public DateTime? OrderDate { get; set; }
            public int CustomerId { get; set; }
            public decimal OrderTotal { get; set; }
            public string FulfillmentType { get; set; } = "pickup";
            public string? DeliveryAddress { get; set; }
            public List<CreateOrderLineRequest> OrderLines { get; set; } = new();
        }

        public class CreateOrderLineRequest
        {
            public int ProductId { get; set; }
            public int ProductTypeId { get; set; }
            public int Quantity { get; set; }
        }

        public class UpdateOrderRequest
        {
            public DateTime? OrderDate { get; set; }
            public int CustomerId { get; set; }
            public string FulfillmentType { get; set; } = "pickup";
            public string? DeliveryAddress { get; set; }
        }

        public class UpdateOrderItemRequest
        {
            public int Quantity { get; set; }
        }

        public class OrderDto
        {
            public int OrderId { get; set; }
            public DateTime OrderDate { get; set; }
            public bool IsDelivery { get; set; }
            public DateTime DeliveryDate { get; set; }
            public string DeliveryAddress { get; set; } = string.Empty;
            public string FulfillmentType { get; set; } = "pickup";
            public int CustomerId { get; set; }
            public string CustomerName { get; set; } = string.Empty;
            public int ItemCount { get; set; }
            public decimal SubTotal { get; set; }
            public decimal DeliveryFee { get; set; }
            public decimal OrderTotal { get; set; }
            public List<OrderItemDto> Items { get; set; } = new();
        }

        private static string BuildCustomerAddress(Customer customer)
        {
            var addressParts = new[]
            {
                customer.Address,
                customer.Apartment,
                customer.City,
                customer.State,
                customer.ZipCode
            }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim());

            return string.Join(", ", addressParts);
        }

        public class OrderItemDto
        {
            public int OrderItemId { get; set; }
            public int ProductId { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public int ProductTypeId { get; set; }
            public string ProductTypeName { get; set; } = string.Empty;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal LineTotal { get; set; }
        }
    }
}
