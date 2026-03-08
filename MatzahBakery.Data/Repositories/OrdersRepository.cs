using Microsoft.EntityFrameworkCore;
using MatzahBakery.Data.Repositories.Contracts;

namespace MatzahBakery.Data;

// Tag: Orders Repository
public class OrdersRepository
{
    private readonly MatzahBakeryDataContext _context;

    public OrdersRepository(MatzahBakeryDataContext context)
    {
        _context = context;
    }

    // Tag: Read Orders With Customer
    public async Task<List<Order>> GetAllOrdersWithCustomerAsync()
    {
        return await _context.orders
            .AsNoTracking()
            .Include(order => order.Customer)
            .OrderByDescending(order => order.OrderDate)
            .ThenByDescending(order => order.OrderId)
            .ToListAsync();
    }

    // Tag: Read Order Items By Order Ids
    public async Task<List<OrderItems>> GetOrderItemsByOrderIdsAsync(List<int> orderIds)
    {
        return await _context.orderItems
            .AsNoTracking()
            .Where(item => orderIds.Contains(item.OrderID))
            .ToListAsync();
    }

    // Tag: Read Product-Type Links By Ids
    public async Task<List<ProductToProductType>> GetProductTypeLinksByIdsAsync(List<int> productTypeLinkIds)
    {
        return await _context.productToProductTypes
            .AsNoTracking()
            .Include(link => link.Product)
            .Include(link => link.ProductType)
            .Where(link => productTypeLinkIds.Contains(link.ProductToProdutTypeID))
            .ToListAsync();
    }

    // Tag: Create Order
    public async Task<CreateOrderResult> CreateOrderAsync(CreateOrUpdateOrderData request)
    {
        var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer == null)
        {
            return new CreateOrderResult { Status = SaveOrderStatus.CustomerNotFound };
        }

        var normalizedLines = request.OrderLines
            .Where(line => line.Quantity > 0)
            .ToList();

        if (!normalizedLines.Any())
        {
            return new CreateOrderResult { Status = SaveOrderStatus.NoValidLines };
        }

        var resolvedLines = new List<ResolvedOrderLine>();
        foreach (var line in normalizedLines)
        {
            var productTypeLink = await _context.productToProductTypes
                .AsNoTracking()
                .FirstOrDefaultAsync(link =>
                    link.ProductId == line.ProductId &&
                    link.ProductTypeId == line.ProductTypeId);

            if (productTypeLink == null)
            {
                return new CreateOrderResult
                {
                    Status = SaveOrderStatus.InvalidProductTypeCombination,
                    InvalidProductId = line.ProductId,
                    InvalidProductTypeId = line.ProductTypeId
                };
            }

            resolvedLines.Add(new ResolvedOrderLine
            {
                ProductToProductTypeId = productTypeLink.ProductToProdutTypeID,
                Quantity = line.Quantity
            });
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

        var orderItems = resolvedLines.Select(line => new OrderItems
        {
            OrderID = order.OrderId,
            ProductToProductTypeID = line.ProductToProductTypeId,
            Quantity = line.Quantity
        }).ToList();

        _context.orderItems.AddRange(orderItems);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new CreateOrderResult
        {
            Status = SaveOrderStatus.Success,
            OrderId = order.OrderId,
            ItemsAffected = orderItems.Count
        };
    }

    // Tag: Update Existing Order
    public async Task<UpdateOrderResult> UpdateOrderAsync(int orderId, CreateOrUpdateOrderData request)
    {
        var order = await _context.orders.FirstOrDefaultAsync(item => item.OrderId == orderId);
        if (order == null)
        {
            return new UpdateOrderResult { Status = SaveOrderStatus.OrderNotFound };
        }

        var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer == null)
        {
            return new UpdateOrderResult { Status = SaveOrderStatus.CustomerNotFound };
        }

        var normalizedLines = request.OrderLines
            .Where(line => line.Quantity > 0)
            .ToList();

        if (!normalizedLines.Any())
        {
            return new UpdateOrderResult { Status = SaveOrderStatus.NoValidLines };
        }

        var resolvedLines = new List<ResolvedOrderLine>();
        foreach (var line in normalizedLines)
        {
            var productTypeLink = await _context.productToProductTypes
                .AsNoTracking()
                .FirstOrDefaultAsync(link =>
                    link.ProductId == line.ProductId &&
                    link.ProductTypeId == line.ProductTypeId);

            if (productTypeLink == null)
            {
                return new UpdateOrderResult
                {
                    Status = SaveOrderStatus.InvalidProductTypeCombination,
                    InvalidProductId = line.ProductId,
                    InvalidProductTypeId = line.ProductTypeId
                };
            }

            resolvedLines.Add(new ResolvedOrderLine
            {
                ProductToProductTypeId = productTypeLink.ProductToProdutTypeID,
                Quantity = line.Quantity
            });
        }

        var isDelivery = string.Equals(request.FulfillmentType, "delivery", StringComparison.OrdinalIgnoreCase);
        var customerAddress = BuildCustomerAddress(customer);

        await using var transaction = await _context.Database.BeginTransactionAsync();

        order.OrderDate = request.OrderDate ?? order.OrderDate;
        order.IsDelivery = isDelivery;
        order.DeliveryDate = request.OrderDate ?? order.DeliveryDate;
        order.DeliveryAddress = isDelivery
            ? (!string.IsNullOrWhiteSpace(request.DeliveryAddress) ? request.DeliveryAddress.Trim() : customerAddress)
            : string.Empty;
        order.CustomerId = request.CustomerId;

        var existingItems = await _context.orderItems
            .Where(item => item.OrderID == orderId)
            .ToListAsync();

        _context.orderItems.RemoveRange(existingItems);

        var newOrderItems = resolvedLines.Select(line => new OrderItems
        {
            OrderID = order.OrderId,
            ProductToProductTypeID = line.ProductToProductTypeId,
            Quantity = line.Quantity
        }).ToList();

        _context.orderItems.AddRange(newOrderItems);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new UpdateOrderResult
        {
            Status = SaveOrderStatus.Success,
            OrderId = order.OrderId,
            ItemsAffected = newOrderItems.Count
        };
    }

    // Tag: Delete Order And Items
    public async Task<bool> DeleteOrderAsync(int orderId)
    {
        var order = await _context.orders.FirstOrDefaultAsync(item => item.OrderId == orderId);
        if (order == null)
        {
            return false;
        }

        var relatedItems = await _context.orderItems
            .Where(item => item.OrderID == orderId)
            .ToListAsync();

        _context.orderItems.RemoveRange(relatedItems);
        _context.orders.Remove(order);
        await _context.SaveChangesAsync();
        return true;
    }

    // Tag: Update Single Order Item Quantity
    public async Task<UpdateOrderItemStatus> UpdateOrderItemQuantityAsync(int orderId, int orderItemId, int quantity)
    {
        var orderExists = await _context.orders.AnyAsync(item => item.OrderId == orderId);
        if (!orderExists)
        {
            return UpdateOrderItemStatus.OrderNotFound;
        }

        var orderItem = await _context.orderItems
            .FirstOrDefaultAsync(item => item.OrderItemsID == orderItemId && item.OrderID == orderId);

        if (orderItem == null)
        {
            return UpdateOrderItemStatus.OrderItemNotFound;
        }

        orderItem.Quantity = quantity;
        await _context.SaveChangesAsync();
        return UpdateOrderItemStatus.Updated;
    }

    // Tag: Build Fallback Delivery Address
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
        .Select(value => value.Trim());

        return string.Join(", ", addressParts);
    }

    // Tag: Internal Resolved Order Line
    private class ResolvedOrderLine
    {
        public int ProductToProductTypeId { get; set; }
        public int Quantity { get; set; }
    }
}
