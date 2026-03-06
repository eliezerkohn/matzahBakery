using System.Text.Json.Serialization;

namespace MatzahBakery.Data
{
    public class Order
    {
        public int OrderId { get; set; }
        public DateTime OrderDate { get; set; }
        public int CustomerId { get; set; }
        public bool IsDelivery { get; set; }
        public string DeliveryAddress { get; set; }
        public DateTime DeliveryDate { get; set; }
        [JsonIgnore]
        public Customer Customer { get; set; }

        public List<Product> Products { get; set; }
    }
}