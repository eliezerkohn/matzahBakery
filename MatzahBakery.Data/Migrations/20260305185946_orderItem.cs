using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatzahBakery.Data.Migrations
{
    /// <inheritdoc />
    public partial class orderItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductToProdutTypeID",
                table: "productToProductTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "orderToProductType",
                columns: table => new
                {
                    OrderItemsID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderID = table.Column<int>(type: "int", nullable: false),
                    ProductToProductTypeID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_orderToProductType", x => x.OrderItemsID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "orderToProductType");

            migrationBuilder.DropColumn(
                name: "ProductToProdutTypeID",
                table: "productToProductTypes");
        }
    }
}
