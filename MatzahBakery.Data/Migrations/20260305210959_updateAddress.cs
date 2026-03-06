using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatzahBakery.Data.Migrations
{
    /// <inheritdoc />
    public partial class updateAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrderItemsID",
                table: "productToProductTypes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddress",
                table: "orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryDate",
                table: "orders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Apartment",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZipCode",
                table: "customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_productToProductTypes_OrderItemsID",
                table: "productToProductTypes",
                column: "OrderItemsID");

            migrationBuilder.AddForeignKey(
                name: "FK_productToProductTypes_orderItems_OrderItemsID",
                table: "productToProductTypes",
                column: "OrderItemsID",
                principalTable: "orderItems",
                principalColumn: "OrderItemsID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_productToProductTypes_orderItems_OrderItemsID",
                table: "productToProductTypes");

            migrationBuilder.DropIndex(
                name: "IX_productToProductTypes_OrderItemsID",
                table: "productToProductTypes");

            migrationBuilder.DropColumn(
                name: "OrderItemsID",
                table: "productToProductTypes");

            migrationBuilder.DropColumn(
                name: "DeliveryAddress",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryDate",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "Apartment",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "City",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "State",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "ZipCode",
                table: "customers");
        }
    }
}
