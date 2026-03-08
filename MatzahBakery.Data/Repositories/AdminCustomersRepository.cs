using Microsoft.EntityFrameworkCore;
using MatzahBakery.Data.Repositories.Contracts;

namespace MatzahBakery.Data;

// Tag: Admin Customer Repository
public class AdminCustomersRepository
{
    private readonly MatzahBakeryDataContext _context;

    public AdminCustomersRepository(MatzahBakeryDataContext context)
    {
        _context = context;
    }

    // Tag: Read Customers List
    public async Task<List<Customer>> GetAllAdminCustomersAsync()
    {
        return await _context.customers
            .AsNoTracking()
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    // Tag: Update Customer
    public async Task<bool> UpdateCustomerAsync(int customerId, AdminCustomerUpdateData request)
    {
        var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == customerId);
        if (customer == null)
        {
            return false;
        }

        customer.FirstName = (request.FirstName ?? string.Empty).Trim();
        customer.LastName = (request.LastName ?? string.Empty).Trim();
        customer.Email = (request.Email ?? string.Empty).Trim();
        customer.PhoneNumber = (request.PhoneNumber ?? string.Empty).Trim();
        customer.Address = (request.Address ?? string.Empty).Trim();
        customer.Apartment = (request.Apartment ?? string.Empty).Trim();
        customer.City = (request.City ?? string.Empty).Trim();
        customer.State = (request.State ?? string.Empty).Trim();
        customer.ZipCode = (request.ZipCode ?? string.Empty).Trim();

        await _context.SaveChangesAsync();
        return true;
    }

    // Tag: Delete Customer With Guard
    public async Task<DeleteCustomerStatus> DeleteCustomerAsync(int customerId)
    {
        var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == customerId);
        if (customer == null)
        {
            return DeleteCustomerStatus.NotFound;
        }

        var hasOrders = await _context.orders.AnyAsync(order => order.CustomerId == customerId);
        if (hasOrders)
        {
            return DeleteCustomerStatus.HasOrders;
        }

        _context.customers.Remove(customer);
        await _context.SaveChangesAsync();
        return DeleteCustomerStatus.Deleted;
    }
}
