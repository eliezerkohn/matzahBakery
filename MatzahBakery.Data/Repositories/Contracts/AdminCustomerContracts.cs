namespace MatzahBakery.Data.Repositories.Contracts;

// Tag: Admin Customer Update DTO
public class AdminCustomerUpdateData
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Apartment { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
}

// Tag: Admin Customer Delete Result
public enum DeleteCustomerStatus
{
    NotFound,
    HasOrders,
    Deleted
}
