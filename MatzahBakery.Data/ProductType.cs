using System.Text.Json.Serialization;

namespace MatzahBakery.Data
{
    public class ProductType
    {
        public int ProductTypeId { get; set; }
        public string TypeName { get; set; }
        public List<ProductToProductType> productToProductTypes { get; set; }
    }
}