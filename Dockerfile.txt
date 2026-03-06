FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm

COPY . .

RUN cd MatzahBakery.Web/ClientApp && npm install
RUN cd MatzahBakery.Web/ClientApp && npm run build
RUN dotnet publish MatzahBakery.Web/MatzahBakery.Web.csproj -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "MatzahBakery.Web.dll"]