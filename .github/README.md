# SPPC System Monitor Server

## dev

```bash
dotnet run --project sppc.csproj
```

## build

```bash
dotnet restore sppc.csproj
dotnet clean sppc.csproj
dotnet publish sppc.csproj -c Release -r win-x64
```

port `6886`
