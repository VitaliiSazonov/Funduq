
$url  = 'https://jftowqfrhhohkqkslfaa.supabase.co'
$svc  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdG93cWZyaGhvaGtxa3NsZmFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUxNzI2MywiZXhwIjoyMDkwMDkzMjYzfQ.7jnYk9NEO_xKOoLoBp-kueuX4u9n7LcAQXPvjNJ7JiQ'
$anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdG93cWZyaGhvaGtxa3NsZmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTcyNjMsImV4cCI6MjA5MDA5MzI2M30.h-ZsQL9FFeiLMAtXtxYG5RboMJR8-41SJholPSrY86c'

function Invoke-Rest {
    param(
        [string]$Method = 'GET',
        [string]$Uri,
        [hashtable]$Headers,
        [string]$Body = $null
    )
    try {
        $params = @{
            Method      = $Method
            Uri         = $Uri
            Headers     = $Headers
            ErrorAction = 'Stop'
            UseBasicParsing = $true
        }
        if ($Body) { $params['Body'] = $Body }
        $r = Invoke-WebRequest @params
        return [PSCustomObject]@{ Code = [int]$r.StatusCode; Body = $r.Content; Headers = $r.Headers }
    } catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
        $body = ''
        if ($resp) {
            $stream = $resp.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } else {
            $body = $_.Exception.Message
        }
        return [PSCustomObject]@{ Code = $code; Body = $body; Headers = @{} }
    }
}

$hdrs_svc = @{
    'apikey'        = $svc
    'Authorization' = "Bearer $svc"
    'Content-Type'  = 'application/json'
}
$hdrs_svc_count = @{
    'apikey'        = $svc
    'Authorization' = "Bearer $svc"
    'Content-Type'  = 'application/json'
    'Prefer'        = 'count=exact'
}
$hdrs_anon = @{
    'apikey'        = $anon
    'Content-Type'  = 'application/json'
}

# ─── STEP 1: Table existence ───────────────────────────────────────────────
Write-Host "`n=== STEP 1: Table existence ===" -ForegroundColor Cyan
$r1 = Invoke-Rest -Uri "$url/rest/v1/booking_requests?select=id&limit=0" -Headers $hdrs_svc_count
Write-Host "HTTP: $($r1.Code)"
Write-Host "Content-Range: $($r1.Headers['Content-Range'])"
Write-Host "Body: $($r1.Body)"

# ─── STEP 2: All 14 columns ────────────────────────────────────────────────
Write-Host "`n=== STEP 2: All 14 columns ===" -ForegroundColor Cyan
$cols = 'id,property_id,host_id,guest_name,guest_phone,check_in,check_out,total_guests,message,status,admin_comment,host_reply,created_at,updated_at'
$r2 = Invoke-Rest -Uri "$url/rest/v1/booking_requests?select=$cols&limit=0" -Headers $hdrs_svc
Write-Host "HTTP: $($r2.Code)"
Write-Host "Body: $($r2.Body)"

# ─── STEP 6-pre: Count before ──────────────────────────────────────────────
Write-Host "`n=== STEP 6-pre: Count before Step 3 ===" -ForegroundColor Cyan
$r6pre = Invoke-Rest -Uri "$url/rest/v1/booking_requests?select=id&limit=0" -Headers $hdrs_svc_count
Write-Host "HTTP: $($r6pre.Code) | Content-Range: $($r6pre.Headers['Content-Range'])"

# ─── STEP 3.1: Get a test property ─────────────────────────────────────────
Write-Host "`n=== STEP 3.1: Get test property ===" -ForegroundColor Cyan
$r31 = Invoke-Rest -Uri "$url/rest/v1/properties?select=id,owner_id&limit=1" -Headers $hdrs_svc
Write-Host "HTTP: $($r31.Code)"
Write-Host "Body: $($r31.Body)"

$p_id    = $null
$p_owner = $null
if ($r31.Code -eq 200 -and $r31.Body -ne '[]') {
    $prop    = ($r31.Body | ConvertFrom-Json)[0]
    $p_id    = $prop.id
    $p_owner = $prop.owner_id
    Write-Host "p_id=$p_id  p_owner=$p_owner"
} else {
    Write-Host "ERROR: No properties found. Skipping Step 3 trigger test."
}

# ─── STEP 3.2: Trigger smoke test ──────────────────────────────────────────
$br_id = $null
if ($p_id) {
    Write-Host "`n=== STEP 3.2: Trigger set_host_id smoke ===" -ForegroundColor Cyan
    $hdrs_svc_repr = $hdrs_svc.Clone()
    $hdrs_svc_repr['Prefer'] = 'return=representation'

    $body32 = [ordered]@{
        property_id = $p_id
        host_id     = '00000000-0000-0000-0000-000000000000'
        guest_name  = 'Antigravity Smoke 3-bis'
        guest_phone = '+971500000000'
        check_in    = '2026-07-01'
        check_out   = '2026-07-05'
    } | ConvertTo-Json

    $r32 = Invoke-Rest -Method POST -Uri "$url/rest/v1/booking_requests" -Headers $hdrs_svc_repr -Body $body32
    Write-Host "HTTP: $($r32.Code)"
    Write-Host "Body: $($r32.Body)"
    if ($r32.Code -eq 201) {
        $row = ($r32.Body | ConvertFrom-Json)
        if ($row -is [System.Array]) { $row = $row[0] }
        $br_id     = $row.id
        $host_resp = $row.host_id
        Write-Host "br_id=$br_id"
        Write-Host "host_id_in_response=$host_resp"
        Write-Host "p_owner=$p_owner"
        Write-Host "status=$($row.status)  total_guests=$($row.total_guests)"
        Write-Host "Trigger OK? $(if ($host_resp -eq $p_owner) { 'YES - host_id matches p_owner' } else { 'NO - MISMATCH!' })"
    }
}

# ─── STEP 3.3: CHECK check_out > check_in ──────────────────────────────────
if ($p_id) {
    Write-Host "`n=== STEP 3.3: CHECK check_out > check_in ===" -ForegroundColor Cyan
    $body33 = [ordered]@{
        property_id = $p_id
        host_id     = '00000000-0000-0000-0000-000000000000'
        guest_name  = 'Bad Date'
        guest_phone = '+971500000001'
        check_in    = '2026-07-05'
        check_out   = '2026-07-01'
    } | ConvertTo-Json
    $r33 = Invoke-Rest -Method POST -Uri "$url/rest/v1/booking_requests" -Headers $hdrs_svc -Body $body33
    Write-Host "HTTP: $($r33.Code)"
    Write-Host "Body: $($r33.Body)"
}

# ─── STEP 3.4: CHECK status enum ───────────────────────────────────────────
if ($p_id) {
    Write-Host "`n=== STEP 3.4: CHECK status enum ===" -ForegroundColor Cyan
    $body34 = [ordered]@{
        property_id = $p_id
        host_id     = '00000000-0000-0000-0000-000000000000'
        guest_name  = 'Bad Status'
        guest_phone = '+971500000002'
        check_in    = '2026-07-01'
        check_out   = '2026-07-05'
        status      = 'InvalidStatus'
    } | ConvertTo-Json
    $r34 = Invoke-Rest -Method POST -Uri "$url/rest/v1/booking_requests" -Headers $hdrs_svc -Body $body34
    Write-Host "HTTP: $($r34.Code)"
    Write-Host "Body: $($r34.Body)"
}

# ─── STEP 3.5: Cleanup ─────────────────────────────────────────────────────
Write-Host "`n=== STEP 3.5: Cleanup ===" -ForegroundColor Cyan
if ($br_id) {
    $rdel1 = Invoke-Rest -Method DELETE -Uri "$url/rest/v1/booking_requests?id=eq.$br_id" -Headers $hdrs_svc
    Write-Host "DELETE by id: HTTP $($rdel1.Code)"
}
$rdel2 = Invoke-Rest -Method DELETE -Uri "$url/rest/v1/booking_requests?guest_name=eq.Antigravity%20Smoke%203-bis" -Headers $hdrs_svc
Write-Host "DELETE by guest_name (safety): HTTP $($rdel2.Code)"

# ─── STEP 4: RLS anon test ─────────────────────────────────────────────────
Write-Host "`n=== STEP 4: RLS anon test ===" -ForegroundColor Cyan
$r4 = Invoke-Rest -Uri "$url/rest/v1/booking_requests?select=id&limit=1" -Headers $hdrs_anon
Write-Host "HTTP: $($r4.Code)"
Write-Host "Body: $($r4.Body)"
$rls_ok = ($r4.Body.Trim() -eq '[]' -or $r4.Body.Trim() -eq '')
Write-Host "RLS blocks anon? $(if ($rls_ok) { 'YES (empty array)' } else { 'NO - DATA LEAKED!' })"

# ─── STEP 5.1: profiles.role CHECK ─────────────────────────────────────────
Write-Host "`n=== STEP 5.1: profiles.role CHECK constraint ===" -ForegroundColor Cyan
$r5g = Invoke-Rest -Uri "$url/rest/v1/profiles?select=id,role&limit=1" -Headers $hdrs_svc
Write-Host "GET profiles HTTP: $($r5g.Code)"
Write-Host "Body: $($r5g.Body)"

$existing_id   = $null
$original_role = $null
if ($r5g.Code -eq 200 -and $r5g.Body.Trim() -ne '[]') {
    $prof = ($r5g.Body | ConvertFrom-Json)
    if ($prof -is [System.Array]) { $prof = $prof[0] }
    $existing_id   = $prof.id
    $original_role = $prof.role
    Write-Host "Existing profile id=$existing_id  role=$original_role"

    $body51 = '{"role":"owner"}'
    $r51 = Invoke-Rest -Method PATCH -Uri "$url/rest/v1/profiles?id=eq.$existing_id" -Headers $hdrs_svc -Body $body51
    Write-Host "PATCH role=owner HTTP: $($r51.Code)"
    Write-Host "Body: $($r51.Body)"

    if ($r51.Code -ne 400 -and $r51.Code -ne 409 -and $r51.Code -ne 422) {
        Write-Host "WARNING: CHECK constraint did NOT block 'owner'! Reverting..."
        $rbody = "{`"role`":`"$original_role`"}"
        $revert = Invoke-Rest -Method PATCH -Uri "$url/rest/v1/profiles?id=eq.$existing_id" -Headers $hdrs_svc -Body $rbody
        Write-Host "Revert HTTP: $($revert.Code) | Body: $($revert.Body)"
    }
} else {
    Write-Host "No profiles found or error."
}

# ─── STEP 5.2: No role=owner profiles ──────────────────────────────────────
Write-Host "`n=== STEP 5.2: No profiles with role=owner ===" -ForegroundColor Cyan
$r52 = Invoke-Rest -Uri "$url/rest/v1/profiles?select=role&role=eq.owner" -Headers $hdrs_svc
Write-Host "HTTP: $($r52.Code)"
Write-Host "Body: $($r52.Body)"

# ─── STEP 6-post: Count after ──────────────────────────────────────────────
Write-Host "`n=== STEP 6-post: Count after Step 5 ===" -ForegroundColor Cyan
$r6post = Invoke-Rest -Uri "$url/rest/v1/booking_requests?select=id&limit=0" -Headers $hdrs_svc_count
Write-Host "HTTP: $($r6post.Code) | Content-Range: $($r6post.Headers['Content-Range'])"

Write-Host "`n=== ALL STEPS DONE ===" -ForegroundColor Green
