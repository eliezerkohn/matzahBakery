using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class customersController : ControllerBase
    {
        private readonly CustomersRepository _repository;

        public customersController(CustomersRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [Route("varify")]
        public Customer VarifyByPhone(string phone)
        {
            return _repository.VarifyByPhone(phone);
        }

        [HttpGet("{id}")]
        public ActionResult<Customer> GetCustomerById(int id)
        {
            var customer = _repository.GetCustomerById(id);

            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            return Ok(customer);
        }

        [HttpPost]
        [Route("add")]
        public Customer AddCustomer(Customer customer)
        {
            return _repository.AddCustomer(customer);
        }
    }
}
