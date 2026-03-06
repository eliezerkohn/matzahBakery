using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MatzahBakery.Data
{
    public class MatzahBakeryRepository
    {
        private string _connectionString;

        public MatzahBakeryRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public Customer VarifyByPhone(string phoneNumber)
        {
            using var context = new MatzahBakeryDataContext(_connectionString);
            return context.customers.FirstOrDefault(customer => customer.PhoneNumber == phoneNumber);
        }

        public Customer AddCustomer(Customer customer)
        {
            using var context = new MatzahBakeryDataContext(_connectionString);
            context.customers.Add(customer);
            context.SaveChanges();
            return customer;
        }
    }
}
