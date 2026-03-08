using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Data;

// Tag: Customer Account Repository
public class CustomersRepository
{
    private readonly MatzahBakeryDataContext _context;

    public CustomersRepository(MatzahBakeryDataContext context)
    {
        _context = context;
    }

    // Tag: Verify By Phone
    public Customer VarifyByPhone(string phoneNumber)
    {
        return _context.customers.FirstOrDefault(customer => customer.PhoneNumber == phoneNumber);
    }

    // Tag: Find Customer By Id
    public Customer GetCustomerById(int customerId)
    {
        return _context.customers.FirstOrDefault(item => item.Id == customerId);
    }

    // Tag: Create Customer
    public Customer AddCustomer(Customer customer)
    {
        _context.customers.Add(customer);
        _context.SaveChanges();
        return customer;
    }
}
