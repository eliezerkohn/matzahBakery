namespace MatzahBakery.Data
{
    public class OrderItems
    {
        public int OrderItemsID { get; set; }
        public int OrderID { get; set; }
        public int ProductToProductTypeID { get; set; }
        public int Quantity { get; set; }
        public List<ProductToProductType> ProductToProductTypes { get; set; }
    }
}