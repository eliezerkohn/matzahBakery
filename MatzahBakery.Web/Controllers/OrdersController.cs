using MatzahBakery.Data;
using MatzahBakery.Data.Repositories.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly OrdersRepository _repository;
        private const decimal DeliveryFee = 25m;
        private const decimal TaxRate = 0.08875m;

        public OrdersController(OrdersRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
        {
            var orders = await _repository.GetAllOrdersWithCustomerAsync();

            if (!orders.Any())
            {
                return Ok(new List<OrderDto>());
            }

            var orderIds = orders.Select(order => order.OrderId).ToList();
            var orderItems = await _repository.GetOrderItemsByOrderIdsAsync(orderIds);

            var productTypeLinkIds = orderItems
                .Select(item => item.ProductToProductTypeID)
                .Distinct()
                .ToList();

            var productTypeLinks = await _repository.GetProductTypeLinksByIdsAsync(productTypeLinkIds);

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
                    OrderTotal = CalculateOrderTotal(lines.Sum(line => line.LineTotal), order.IsDelivery),
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

            var result = await _repository.CreateOrderAsync(new CreateOrUpdateOrderData
            {
                OrderDate = request.OrderDate,
                CustomerId = request.CustomerId,
                FulfillmentType = request.FulfillmentType,
                DeliveryAddress = request.DeliveryAddress,
                OrderLines = request.OrderLines.Select(line => new OrderLineData
                {
                    ProductId = line.ProductId,
                    ProductTypeId = line.ProductTypeId,
                    Quantity = line.Quantity
                }).ToList()
            });

            if (result.Status == SaveOrderStatus.CustomerNotFound)
            {
                return BadRequest(new { message = "Customer does not exist." });
            }

            if (result.Status == SaveOrderStatus.NoValidLines)
            {
                return BadRequest(new { message = "At least one order line must have quantity greater than 0." });
            }

            if (result.Status == SaveOrderStatus.InvalidProductTypeCombination)
            {
                return BadRequest(new
                {
                    message = $"Invalid product/type combination for productId={result.InvalidProductId}, productTypeId={result.InvalidProductTypeId}."
                });
            }

            return Ok(new { orderId = result.OrderId, orderItemsCreated = result.ItemsAffected });
        }

        [HttpPut("{orderId}")]
        public async Task<ActionResult> Update(int orderId, [FromBody] UpdateOrderRequest request)
        {
            if (request == null || request.CustomerId <= 0)
            {
                return BadRequest(new { message = "customerId is required." });
            }

            if (request.OrderLines == null || !request.OrderLines.Any())
            {
                return BadRequest(new { message = "At least one order line is required." });
            }

            var result = await _repository.UpdateOrderAsync(orderId, new CreateOrUpdateOrderData
            {
                OrderDate = request.OrderDate,
                CustomerId = request.CustomerId,
                FulfillmentType = request.FulfillmentType,
                DeliveryAddress = request.DeliveryAddress,
                OrderLines = request.OrderLines.Select(line => new OrderLineData
                {
                    ProductId = line.ProductId,
                    ProductTypeId = line.ProductTypeId,
                    Quantity = line.Quantity
                }).ToList()
            });

            if (result.Status == SaveOrderStatus.OrderNotFound)
            {
                return NotFound(new { message = "Order not found." });
            }

            if (result.Status == SaveOrderStatus.CustomerNotFound)
            {
                return BadRequest(new { message = "Customer does not exist." });
            }

            if (result.Status == SaveOrderStatus.NoValidLines)
            {
                return BadRequest(new { message = "At least one order line must have quantity greater than 0." });
            }

            if (result.Status == SaveOrderStatus.InvalidProductTypeCombination)
            {
                return BadRequest(new
                {
                    message = $"Invalid product/type combination for productId={result.InvalidProductId}, productTypeId={result.InvalidProductTypeId}."
                });
            }

            return Ok(new { message = "Order updated.", orderId = result.OrderId, orderItemsUpdated = result.ItemsAffected });
        }

        [HttpDelete("{orderId}")]
        public async Task<ActionResult> Delete(int orderId)
        {
            var deleted = await _repository.DeleteOrderAsync(orderId);
            if (!deleted)
            {
                return NotFound(new { message = "Order not found." });
            }

            return Ok(new { message = "Order deleted." });
        }

        [HttpPut("{orderId}/items/{orderItemId}")]
        public async Task<ActionResult> UpdateOrderItem(int orderId, int orderItemId, [FromBody] UpdateOrderItemRequest request)
        {
            if (request == null || request.Quantity <= 0)
            {
                return BadRequest(new { message = "quantity must be greater than 0." });
            }

            var result = await _repository.UpdateOrderItemQuantityAsync(orderId, orderItemId, request.Quantity);

            if (result == UpdateOrderItemStatus.OrderNotFound)
            {
                return NotFound(new { message = "Order not found." });
            }

            if (result == UpdateOrderItemStatus.OrderItemNotFound)
            {
                return NotFound(new { message = "Order item not found." });
            }

            return Ok(new { message = "Order item updated." });
        }

        public class CreateOrderRequest
        {
            public DateTime? OrderDate { get; set; }
            public int CustomerId { get; set; }
            public string FulfillmentType { get; set; } = "pickup";
            public string DeliveryAddress { get; set; } = string.Empty;
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
            public string DeliveryAddress { get; set; } = string.Empty;
            public List<CreateOrderLineRequest> OrderLines { get; set; } = new();
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

        private static decimal CalculateOrderTotal(decimal subTotal, bool isDelivery)
        {
            var deliveryFee = isDelivery ? DeliveryFee : 0;
            var taxableAmount = subTotal + deliveryFee;
            var taxAmount = taxableAmount * TaxRate;
            return taxableAmount + taxAmount;
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
