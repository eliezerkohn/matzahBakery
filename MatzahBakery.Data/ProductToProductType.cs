namespace MatzahBakery.Data
{
    public class ProductToProductType
    {
        public int ProductToProdutTypeID { get; set; }
        public int ProductId { get; set; }        // Capital P
        public int ProductTypeId { get; set; }    // Capital P
        public decimal Price { get; set; }
        public Product Product { get; set; }
        public ProductType ProductType { get; set; }
    }
}