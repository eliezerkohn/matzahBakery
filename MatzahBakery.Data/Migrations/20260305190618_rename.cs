using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatzahBakery.Data.Migrations
{
    /// <inheritdoc />
    public partial class rename : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_orderToProductType",
                table: "orderToProductType");

            migrationBuilder.RenameTable(
                name: "orderToProductType",
                newName: "orderItems");

            migrationBuilder.AddPrimaryKey(
                name: "PK_orderItems",
                table: "orderItems",
                column: "OrderItemsID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_orderItems",
                table: "orderItems");

            migrationBuilder.RenameTable(
                name: "orderItems",
                newName: "orderToProductType");

            migrationBuilder.AddPrimaryKey(
                name: "PK_orderToProductType",
                table: "orderToProductType",
                column: "OrderItemsID");
        }
    }
}
