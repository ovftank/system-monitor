# TOOL.SUPERPC.VN

- [Project Overview](#project-overview)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

### setup php

Install via Chocolatey:

```powershell
choco install composer -y
choco install php --version=8.1.34 -y
```

Enable `pdo_mysql` extension:

```powershell
$ini = (php --ini | Select-String "Loaded Configuration File" | ForEach-Object { ($_ -split ":")[1].Trim() }); (Get-Content $ini) -replace ';extension=pdo_mysql', 'extension=pdo_mysql' | Set-Content $ini
```

### install dependencies

```bash
pnpm install
cd public/api && composer install
```
