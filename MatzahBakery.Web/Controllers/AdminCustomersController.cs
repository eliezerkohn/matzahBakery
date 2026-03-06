using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/admin/customers")]
    [ApiController]
    public class AdminCustomersController : ControllerBase
    {
        private readonly MatzahBakeryDataContext _context;

        public AdminCustomersController(MatzahBakeryDataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetAll()
        {
            var customers = await _context.customers
                .AsNoTracking()
                .OrderBy(c => c.FirstName)
                .ThenBy(c => c.LastName)
                .ThenBy(c => c.Id)
                .ToListAsync();

            return Ok(customers);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateCustomerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request is required." });
            }

            var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
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
            return Ok(new { message = "Customer updated." });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var customer = await _context.customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            var hasOrders = await _context.orders.AnyAsync(order => order.CustomerId == id);
            if (hasOrders)
            {
                return BadRequest(new { message = "Cannot delete customer with existing orders." });
            }

            _context.customers.Remove(customer);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Customer deleted." });
        }

        public class UpdateCustomerRequest
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
    }
}
