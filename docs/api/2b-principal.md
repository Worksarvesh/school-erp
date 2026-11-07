# Slice 2B: principal OTP login, registration and verification

Endpoints added in slice 2B, with PowerShell commands to try each one by hand. Run them **one at a time, from the repo root**, in the same PowerShell window (later commands reuse variables from earlier ones). Works in Windows PowerShell 5.1 and PowerShell 7.

OTP uses the interim **fixed provider**: every code is `999999` (`OTP_FIXED_CODE`) and no SMS is sent. The API refuses to start with it when `APP_ENV` or `NODE_ENV` is `production`. Replacing it with a real SMS provider is a blocker for any production launch.

## Endpoints

| Method and path                                                     | Auth      | What it does                                                                                    |
| ------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `POST /v1/auth/otp/request`                                         | public    | Starts an OTP login for a mobile number. Always `202 { expiresInSeconds }`, known number or not |
| `POST /v1/auth/otp/verify`                                          | public    | Checks the code. Signs the principal in, or creates the account on a number's first login       |
| `GET /v1/directory/schools?q=`                                      | signed in | Finds schools by name or PIN (name, code, city, PIN only)                                       |
| `POST /v1/me/school-verification-requests`                          | signed in | Claims a school, or describes one that is not listed; resubmits a rejected request              |
| `GET /v1/me/school-verification-requests`                           | signed in | The caller's own requests, newest first, with status and any rejection reason                   |
| `GET /v1/platform/school-verification-requests?status=`             | verifier  | The verification queue (default `pending`), oldest first                                        |
| `GET /v1/platform/school-verification-requests/:requestId`          | verifier  | One request, with the principal's name and phone                                                |
| `POST /v1/platform/school-verification-requests/:requestId/approve` | verifier  | Activates (or creates) the school and makes the requester its principal                         |
| `POST /v1/platform/school-verification-requests/:requestId/reject`  | verifier  | Rejects with a required `reason`                                                                |
| `POST /v1/platform/schools`                                         | verifier  | Adds an unclaimed school to the directory                                                       |

`verifier` means active platform staff (School Verifier or Company Super Admin). Anyone else gets `403`; signed out gets `401`. Every platform call is audit-logged, allowed or not.

## 0. Start everything

Add an OTP hash secret to `.env` once (at least 32 bytes; the API refuses to start without it):

```powershell
Add-Content .env "OTP_HASH_SECRET=$([Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48)))"
```

Start the database, apply migrations and load the demo data:

```powershell
docker compose up -d --wait
```

```powershell
pnpm --filter api exec prisma migrate deploy
```

```powershell
pnpm --filter api run seed
```

Start the API (leave this window open and use a second PowerShell window, at the repo root, for the rest):

```powershell
pnpm --filter api run start:dev
```

## 1. Setup

```powershell
$api = 'http://localhost:3000/v1'
```

```powershell
$pw = ((Get-Content .env | Where-Object { $_ -match '^SEED_DEMO_PASSWORD=' }) -split '=', 2)[1]
```

```powershell
function Show-ApiError { param([scriptblock]$Call) try { & $Call } catch { "HTTP $([int]$_.Exception.Response.StatusCode): $($_.ErrorDetails.Message)" } }
```

## 2. Existing principal signs in with OTP

Ask for a code for the Sunrise principal (any Indian format works):

```powershell
Invoke-RestMethod -Method Post "$api/auth/otp/request" -ContentType 'application/json' -Body (@{ phone = '9000010101' } | ConvertTo-Json)
```

Verify with the fixed code:

```powershell
$anita = Invoke-RestMethod -Method Post "$api/auth/otp/verify" -ContentType 'application/json' -Body (@{ phone = '9000010101'; code = '999999'; deviceName = 'PowerShell' } | ConvertTo-Json)
```

```powershell
$anita | Select-Object isNewUser, user
```

A wrong code gets `401 invalid_otp`; the fifth wrong try locks the code (`429`). Asking again within 30 seconds also gets `429`:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/otp/request" -ContentType 'application/json' -Body (@{ phone = '9000010101' } | ConvertTo-Json) }
```

## 3. New principal registers

Pick a number nobody uses yet and sign in; `isNewUser` is `true`:

```powershell
Invoke-RestMethod -Method Post "$api/auth/otp/request" -ContentType 'application/json' -Body (@{ phone = '9000010501' } | ConvertTo-Json)
```

```powershell
$newPrincipal = Invoke-RestMethod -Method Post "$api/auth/otp/verify" -ContentType 'application/json' -Body (@{ phone = '9000010501'; code = '999999' } | ConvertTo-Json)
```

```powershell
$np = @{ Authorization = "Bearer $($newPrincipal.accessToken)" }; $newPrincipal.isNewUser
```

Search the directory:

```powershell
(Invoke-RestMethod "$api/directory/schools?q=hillside" -Headers $np).items
```

Claim the unclaimed demo school `sch0003`:

```powershell
$schoolId = (Invoke-RestMethod "$api/directory/schools?q=hillside" -Headers $np).items[0].id
```

```powershell
$claim = Invoke-RestMethod -Method Post "$api/me/school-verification-requests" -Headers $np -ContentType 'application/json' -Body (@{ principalName = 'Kiran Joshi'; schoolId = $schoolId } | ConvertTo-Json)
```

```powershell
(Invoke-RestMethod "$api/me/school-verification-requests" -Headers $np).items | Select-Object id, status, schoolId
```

Until a verifier approves, the school stays closed to this principal (`404`):

```powershell
Show-ApiError { Invoke-RestMethod "$api/schools/$schoolId" -Headers $np }
```

A school that is not listed is described instead: `principalName`, `proposedName`, `proposedAddress` and `proposedPinCode` (6 digits). One pending request at a time (`409 request_pending`).

## 4. Verifier approves or rejects

Sign in as the demo verifier (email + password):

```powershell
$vera = Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'verifier@demo.school-erp.test'; password = $pw } | ConvertTo-Json)
```

```powershell
$vh = @{ Authorization = "Bearer $($vera.accessToken)" }
```

The queue (the seeded "Greenfield School" request from Neha is also there):

```powershell
(Invoke-RestMethod "$api/platform/school-verification-requests" -Headers $vh).items | Select-Object id, principalName, proposedName, schoolId
```

Approve the claim:

```powershell
Invoke-RestMethod -Method Post "$api/platform/school-verification-requests/$($claim.id)/approve" -Headers $vh
```

The new principal can now open the school:

```powershell
Invoke-RestMethod "$api/schools/$schoolId" -Headers $np
```

Reject the seeded request (a reason is required); Neha would see the reason and could resubmit with `previousRequestId`:

```powershell
$neha = (Invoke-RestMethod "$api/platform/school-verification-requests" -Headers $vh).items | Where-Object { $_.proposedName -like 'Greenfield*' }
```

```powershell
Invoke-RestMethod -Method Post "$api/platform/school-verification-requests/$($neha.id)/reject" -Headers $vh -ContentType 'application/json' -Body (@{ reason = 'Could not confirm with the school office' } | ConvertTo-Json)
```

A principal on the platform path gets `403`:

```powershell
Show-ApiError { Invoke-RestMethod "$api/platform/school-verification-requests" -Headers @{ Authorization = "Bearer $($anita.accessToken)" } }
```

## 5. Production guard

The API refuses to start with the fixed OTP provider in production (run in a new window; it exits with an error):

```powershell
$env:APP_ENV = 'production'; $env:OTP_PROVIDER = 'fixed'; pnpm --filter api run start
```

Close that window afterwards so the variables do not stick.

## 6. Audit log

Every OTP request, OTP result, verification decision and platform call is recorded in `audit_logs`, never with the code or the typed phone number:

```powershell
docker compose exec -T postgres psql -U postgres -d school_erp -c "SELECT created_at, action, actor_role, metadata FROM audit_logs ORDER BY created_at DESC LIMIT 10"
```
