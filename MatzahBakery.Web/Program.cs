using MatzahBakery.Data;

namespace MatzahBakery.Web;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddScoped(_ =>
            new MatzahBakeryDataContext(builder.Configuration.GetConnectionString("ConStr")!));
        builder.Services.AddControllersWithViews();

        var app = builder.Build();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseStaticFiles();
        if (app.Environment.IsDevelopment())
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "npm",
                Arguments = "run dev",
                WorkingDirectory = Path.Combine(Directory.GetCurrentDirectory(), "ClientApp"),
                UseShellExecute = true
            };
        
            var spaProcess = System.Diagnostics.Process.Start(psi);
            app.Lifetime.ApplicationStopping.Register(() =>
            {
                if (spaProcess is { HasExited: false })
                {
                    spaProcess.Kill(true);
                }
            });
        }
        app.UseRouting();

		app.MapControllers();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller}/{action=Index}/{id?}");

        app.Run();
    }
}