using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatzahBakery.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderIsDeliveryBit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDelivery",
                table: "orders",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDelivery",
                table: "orders");
        }
    }
}
