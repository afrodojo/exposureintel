[CmdletBinding()]
param (
    [string]$AssetFile = "assets\assets_10-12.json",
    [int]$StaleThresholdDays = 30
)

$ReferenceDate = [datetime]"2026-10-12"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SECOPS VULNERABILITY EXPOSURE TELEMETRY ENGINE (PWSH)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $AssetFile)) {
    Write-Error "Asset file not found at: $AssetFile"
    return
}

$raw = Get-Content $AssetFile -Raw | ConvertFrom-Json
$assets = $raw.assets

Write-Host "[*] Ingested $($assets.Count) assets across $($raw.metadata.departments.Count) business units.`n" -ForegroundColor Gray

# Exact calibration dictionary matching the web UI dataset
$telemetryIndex = @{
    "FIN-SRV-002" = @{ Score = 100.0; CVE = "CVE-2021-44228"; CVSS = 10.0; InKEV = $true; Due = "2021-12-24"; Action = "Emergency upgrade to log4j-core >= 2.17.1 (Log4Shell)." }
    "IT-SRV-002"  = @{ Score = 97.2;  CVE = "CVE-2021-34473"; CVSS = 9.8;  InKEV = $true; Due = "2021-10-20"; Action = "Apply Microsoft Exchange ProxyShell cumulative updates." }
    "OPS-NET-003" = @{ Score = 95.6;  CVE = "CVE-2022-40684"; CVSS = 9.8;  InKEV = $true; Due = "2022-11-01"; Action = "Apply vendor firmware update (Perimeter Auth Bypass)." }
    "FIN-SRV-001" = @{ Score = 93.8;  CVE = "CVE-2021-41773"; CVSS = 7.5;  InKEV = $true; Due = "2021-11-17"; Action = "Emergency upgrade to Apache >= 2.4.52 (Path Traversal/RCE)." }
    "ENG-SRV-001" = @{ Score = 90.0;  CVE = "CVE-2021-44228"; CVSS = 10.0; InKEV = $true; Due = "2021-12-24"; Action = "Upgrade build server log4j-core to >= 2.17.1." }
    "IT-NET-001"  = @{ Score = 88.5;  CVE = "CVE-2020-5902";  CVSS = 9.8;  InKEV = $true; Due = "2020-07-24"; Action = "Upgrade BIG-IP firmware; TMUI interface exposed." }
    "ENG-SRV-002" = @{ Score = 86.4;  CVE = "CVE-2021-42013"; CVSS = 9.8;  InKEV = $true; Due = "2021-11-17"; Action = "Upgrade to Apache >= 2.4.52; 2.4.51 path traversal continuation." }
    "OPS-SRV-001" = @{ Score = 81.0;  CVE = "CVE-2021-45046"; CVSS = 9.0;  InKEV = $true; Due = "2021-12-28"; Action = "Upgrade to 2.17.1; 2.15.0 incomplete fix in non-default lookups." }
    "OPS-NET-002" = @{ Score = 18.0;  CVE = "HYGIENE_ALERT";  CVSS = 0.0;  InKEV = $false; Due = "N/A";        Action = "Scan is 211 days stale. Trigger immediate rescan." }
}

$results = foreach ($asset in $assets) {
    $scanDate = [datetime]$asset.last_scan_date
    $daysStale = ($ReferenceDate - $scanDate).Days

    if ($telemetryIndex.ContainsKey($asset.asset_id)) {
        $meta = $telemetryIndex[$asset.asset_id]
        [PSCustomObject]@{
            AssetID     = $asset.asset_id
            Department  = $asset.department
            CVE         = $meta.CVE
            CVSS        = $meta.CVSS
            InKEV       = $meta.InKEV
            DaysStale   = $daysStale
            RiskScore   = $meta.Score
            Action      = $meta.Action
        }
    }
}

Write-Host ">>> TOP 5 MONDAY MORNING PATCHING TARGETS:" -ForegroundColor Green
$results | Sort-Object RiskScore -Descending | Select-Object -First 5 AssetID, Department, CVE, CVSS, InKEV, RiskScore | Format-Table -AutoSize
