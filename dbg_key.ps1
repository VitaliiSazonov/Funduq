
Get-ChildItem 'c:\Users\Korisnik\Desktop\Funduq' -Recurse -Include '*.env*' -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch 'node_modules|\.next' } | 
    Select-Object FullName | Format-Table -AutoSize

# Also check supabase folder
if (Test-Path 'c:\Users\Korisnik\Desktop\Funduq\supabase') {
    Get-ChildItem 'c:\Users\Korisnik\Desktop\Funduq\supabase' -Recurse -ErrorAction SilentlyContinue | 
        Select-Object FullName | Format-Table -AutoSize
}

# Check if there's a supabase CLI config with keys
$sbConfig = 'c:\Users\Korisnik\Desktop\Funduq\supabase\.env'
if (Test-Path $sbConfig) { Get-Content $sbConfig }

# Check anon key format too
$anon = 'sb_publishable_qq-_tmwXd3RDPreKciD9EA_bQwooBON'
Write-Host "Anon key length: $($anon.Length)"
Write-Host "Anon has dots: $($anon.Contains('.'))"
