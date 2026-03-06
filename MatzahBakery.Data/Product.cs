using System.Text.Json.Serialization;

namespace MatzahBakery.Data
{
    public class Product
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        [JsonIgnore]
        public Order Order { get; set; }
        public List<ProductToProductType> productToProductTypes { get; set; }

    }
}