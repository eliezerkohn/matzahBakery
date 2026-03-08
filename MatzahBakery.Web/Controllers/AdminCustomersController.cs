using MatzahBakery.Data;
using MatzahBakery.Data.Repositories.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/admin/customers")]
    [ApiController]
    public class AdminCustomersController : ControllerBase
    {
        private readonly AdminCustomersRepository _repository;

        public AdminCustomersController(AdminCustomersRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetAll()
        {
            var customers = await _repository.GetAllAdminCustomersAsync();

            return Ok(customers);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateCustomerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request is required." });
            }

            var updated = await _repository.UpdateCustomerAsync(id, new AdminCustomerUpdateData
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                Apartment = request.Apartment,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode
            });

            if (!updated)
            {
                return NotFound(new { message = "Customer not found." });
            }
            return Ok(new { message = "Customer updated." });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _repository.DeleteCustomerAsync(id);

            if (result == DeleteCustomerStatus.NotFound)
            {
                return NotFound(new { message = "Customer not found." });
            }

            if (result == DeleteCustomerStatus.HasOrders)
            {
                return BadRequest(new { message = "Cannot delete customer with existing orders." });
            }

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
