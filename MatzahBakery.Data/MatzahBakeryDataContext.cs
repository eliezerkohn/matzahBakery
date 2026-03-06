using Microsoft.EntityFrameworkCore;

namespace MatzahBakery.Data;

public class MatzahBakeryDataContext : DbContext
{
    private readonly string _connectionString;

    public MatzahBakeryDataContext(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(_connectionString);
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductToProductType>(entity =>
        {
            entity.HasKey(e => new { e.ProductId, e.ProductTypeId });

            entity.HasOne(e => e.Product)
                .WithMany(p => p.productToProductTypes)
                .HasForeignKey(e => e.ProductId);

            entity.HasOne(e => e.ProductType)
                .WithMany(pt => pt.productToProductTypes)
                .HasForeignKey(e => e.ProductTypeId);
        });

        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }

    public DbSet<Customer> customers{ get; set; }
    public DbSet<Order> orders{ get; set; }
    public DbSet<OrderItems> orderItems { get; set; }
    public DbSet<Product> products{ get; set; }
    public DbSet<ProductType> productTypes{ get; set; }
    public DbSet<ProductToProductType> productToProductTypes{ get; set; }
}