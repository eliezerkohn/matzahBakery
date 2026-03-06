using MatzahBakery.Data;
using Microsoft.AspNetCore.Mvc;

namespace MatzahBakery.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class customersController : ControllerBase
    {
        private readonly string _connectionString;

        public customersController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("ConStr");
        }

        private MatzahBakeryRepository CreateRepository()
        {
            return new MatzahBakeryRepository(_connectionString);
        }

        [HttpGet]
        [Route("varify")]
        public Customer VarifyByPhone(string phone)
        {
            var repository = CreateRepository();
            return repository.VarifyByPhone(phone);
        }

        [HttpGet("{id}")]
        public ActionResult<Customer> GetCustomerById(int id)
        {
            var context = new MatzahBakeryDataContext(_connectionString);
            var customer = context.customers.FirstOrDefault(item => item.Id == id);

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
            var repository = CreateRepository();
            return repository.AddCustomer(customer);
        }
    }
}
