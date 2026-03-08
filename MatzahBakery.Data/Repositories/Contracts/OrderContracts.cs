namespace MatzahBakery.Data.Repositories.Contracts;

// Tag: Order Save Request DTO
public class CreateOrUpdateOrderData
{
    public DateTime? OrderDate { get; set; }
    public int CustomerId { get; set; }
    public string FulfillmentType { get; set; } = "pickup";
    public string DeliveryAddress { get; set; }
    public List<OrderLineData> OrderLines { get; set; } = new();
}

// Tag: Order Line DTO
public class OrderLineData
{
    public int ProductId { get; set; }
    public int ProductTypeId { get; set; }
    public int Quantity { get; set; }
}

// Tag: Order Save Status
public enum SaveOrderStatus
{
    OrderNotFound,
    CustomerNotFound,
    NoValidLines,
    InvalidProductTypeCombination,
    Success
}

// Tag: Create Order Result DTO
public class CreateOrderResult
{
    public SaveOrderStatus Status { get; set; }
    public int OrderId { get; set; }
    public int ItemsAffected { get; set; }
    public int InvalidProductId { get; set; }
    public int InvalidProductTypeId { get; set; }
}

// Tag: Update Order Result DTO
public class UpdateOrderResult : CreateOrderResult
{
}

// Tag: Update Order Item Status
public enum UpdateOrderItemStatus
{
    OrderNotFound,
    OrderItemNotFound,
    Updated
}
