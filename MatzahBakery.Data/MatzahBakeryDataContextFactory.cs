using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MatzahBakery.Data;

public class MatzahBakeryDataContextFactory : IDesignTimeDbContextFactory<MatzahBakeryDataContext>
{
    public MatzahBakeryDataContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
           .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), 
           $"..{Path.DirectorySeparatorChar}MatzahBakery.Web"))
           .AddJsonFile("appsettings.json")
           .AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true).Build();

        return new MatzahBakeryDataContext(config.GetConnectionString("ConStr"));
    }
}