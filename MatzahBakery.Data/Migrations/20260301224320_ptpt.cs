using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatzahBakery.Data.Migrations
{
    /// <inheritdoc />
    public partial class ptpt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_productTypes_products_ProductId",
                table: "productTypes");

            migrationBuilder.DropIndex(
                name: "IX_productTypes_ProductId",
                table: "productTypes");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "productTypes");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "productTypes");

            migrationBuilder.CreateTable(
                name: "productToProductTypes",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ProductTypeId = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_productToProductTypes", x => new { x.ProductId, x.ProductTypeId });
                    table.ForeignKey(
                        name: "FK_productToProductTypes_productTypes_ProductTypeId",
                        column: x => x.ProductTypeId,
                        principalTable: "productTypes",
                        principalColumn: "ProductTypeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_productToProductTypes_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_productToProductTypes_ProductTypeId",
                table: "productToProductTypes",
                column: "ProductTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "productToProductTypes");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "productTypes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "productTypes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_productTypes_ProductId",
                table: "productTypes",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_productTypes_products_ProductId",
                table: "productTypes",
                column: "ProductId",
                principalTable: "products",
                principalColumn: "ProductId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
