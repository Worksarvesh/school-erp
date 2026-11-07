# Slice 2A: sign-in, sessions, errors

Endpoints added in slice 2A, with PowerShell commands to try each one by hand. Run them **one at a time, from the repo root**, in the same PowerShell window (later commands reuse variables from earlier ones). Works in Windows PowerShell 5.1 and PowerShell 7.

Swagger UI (development only): <http://localhost:3000/docs>

## Endpoints

| Method and path                     | Auth      | What it does                                                                                      |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `POST /v1/auth/login`               | public    | Phone or email + password. Returns an access token (15 min) and a refresh token (30 days)         |
| `POST /v1/auth/refresh`             | public    | Swaps a refresh token for new tokens. The old one stops working; reusing it signs that device out |
| `POST /v1/auth/password-reset`      | public    | Not in V1.1 (resets are started by staff): always `501 not_enabled`                               |
| `POST /v1/auth/logout`              | signed in | Ends the current device's session                                                                 |
| `POST /v1/auth/logout-all`          | signed in | Ends every session of the user                                                                    |
| `GET /v1/me`                        | signed in | Profile plus schools and roles                                                                    |
| `GET /v1/me/sessions`               | signed in | Signed-in devices (`current: true` marks this one)                                                |
| `DELETE /v1/me/sessions/:sessionId` | signed in | Signs one device out (`404` if it is not yours)                                                   |
| `POST /v1/me/password`              | signed in | Needs step-up (OTP): always `501 not_enabled`                                                     |

Every error looks like `{ "error": { "code", "message", "requestId", "details?" } }`, and every response carries an `X-Request-Id` header.

Access tokens are stateless: after logout, an access token already issued keeps working until it expires (at most 15 minutes). Refresh tokens stop working immediately.

## 0. Start everything

Start the database:

```powershell
docker compose up -d --wait
```

Apply migrations:

```powershell
pnpm --filter api exec prisma migrate deploy
```

Load the demo schools and users (safe to repeat):

```powershell
pnpm --filter api run seed
```

Start the API (leave this window open and use a second PowerShell window, at the repo root, for the rest):

```powershell
pnpm --filter api run start:dev
```

## 1. Setup

Base URL:

```powershell
$api = 'http://localhost:3000/v1'
```

Demo password (from your `.env`):

```powershell
$pw = ((Get-Content .env | Where-Object { $_ -match '^SEED_DEMO_PASSWORD=' }) -split '=', 2)[1]
```

Helper that shows the error body instead of a PowerShell exception (run once):

```powershell
function Show-ApiError { param([scriptblock]$Call) try { & $Call } catch { "HTTP $([int]$_.Exception.Response.StatusCode): $($_.ErrorDetails.Message)" } }
```

## 2. Log in

As the Sunrise principal, by email:

```powershell
$login = Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'principal.sunrise@demo.school-erp.test'; password = $pw; deviceName = 'PowerShell' } | ConvertTo-Json)
```

See what came back (user, expiry; tokens are long strings):

```powershell
$login | Select-Object accessTokenExpiresIn, refreshTokenExpiresAt, user
```

Keep the access token in a header:

```powershell
$auth = @{ Authorization = "Bearer $($login.accessToken)" }
```

Phone numbers work too, in any common Indian format (`9000010101`, `+91 90000 10101`):

```powershell
(Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = '90000 10101'; password = $pw } | ConvertTo-Json)).user
```

Wrong password: `401 invalid_credentials`. An unknown account gets exactly the same answer:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'principal.sunrise@demo.school-erp.test'; password = 'wrong-password-1' } | ConvertTo-Json) }
```

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'nobody@demo.school-erp.test'; password = 'wrong-password-1' } | ConvertTo-Json) }
```

Invalid body: `400 validation_failed` with the field problems in `details`:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body '{"identifier":"x"}' }
```

## 3. Who am I

```powershell
Invoke-RestMethod "$api/me" -Headers $auth | ConvertTo-Json -Depth 5
```

Without a token: `401 unauthenticated`:

```powershell
Show-ApiError { Invoke-RestMethod "$api/me" }
```

The school routes from Step 1 now work with a real token:

```powershell
$schoolId = (Invoke-RestMethod "$api/me" -Headers $auth).schools[0].schoolId
```

```powershell
Invoke-RestMethod "$api/schools/$schoolId" -Headers $auth
```

```powershell
(Invoke-RestMethod "$api/schools/$schoolId/members?limit=5" -Headers $auth).items | Format-Table fullName, role, status
```

## 4. Refresh tokens

Swap the refresh token for new tokens:

```powershell
$refreshed = Invoke-RestMethod -Method Post "$api/auth/refresh" -ContentType 'application/json' -Body (@{ refreshToken = $login.refreshToken } | ConvertTo-Json)
```

Using the old refresh token again is treated as theft: `401`, and this device's session is ended:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/refresh" -ContentType 'application/json' -Body (@{ refreshToken = $login.refreshToken } | ConvertTo-Json) }
```

So even the new refresh token is now rejected:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/refresh" -ContentType 'application/json' -Body (@{ refreshToken = $refreshed.refreshToken } | ConvertTo-Json) }
```

Log in again for the next steps:

```powershell
$login = Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'principal.sunrise@demo.school-erp.test'; password = $pw; deviceName = 'PowerShell' } | ConvertTo-Json); $auth = @{ Authorization = "Bearer $($login.accessToken)" }
```

## 5. Devices

Sign in a second "device":

```powershell
$laptop = Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'principal.sunrise@demo.school-erp.test'; password = $pw; deviceName = 'Laptop' } | ConvertTo-Json)
```

List devices:

```powershell
(Invoke-RestMethod "$api/me/sessions" -Headers $auth).items | Format-Table id, deviceName, current, lastUsedAt
```

Sign the laptop out (`204`, no output). The session id is the part of the refresh token before the dot:

```powershell
Invoke-RestMethod -Method Delete "$api/me/sessions/$($laptop.refreshToken.Split('.')[0])" -Headers $auth
```

Its refresh token no longer works:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/refresh" -ContentType 'application/json' -Body (@{ refreshToken = $laptop.refreshToken } | ConvertTo-Json) }
```

## 6. Actions that are not enabled yet

Change password: `501 not_enabled`:

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/me/password" -Headers $auth -ContentType 'application/json' -Body (@{ currentPassword = $pw; newPassword = 'a-brand-new-password' } | ConvertTo-Json) }
```

Password reset: `501 not_enabled`, the same for any identifier (principal OTP login is in [2b-principal.md](2b-principal.md)):

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/password-reset" -ContentType 'application/json' -Body (@{ identifier = '9000010101' } | ConvertTo-Json) }
```

## 7. Request ids

Send your own id and get it back in the header and in error bodies:

```powershell
Show-ApiError { Invoke-RestMethod "$api/no-such-route" -Headers @{ 'X-Request-Id' = 'my-trace-0001' } }
```

```powershell
(Invoke-WebRequest "$api" -UseBasicParsing -Headers @{ 'X-Request-Id' = 'my-trace-0002' }).Headers['X-Request-Id']
```

## 8. Log out

This device only (`204`):

```powershell
Invoke-RestMethod -Method Post "$api/auth/logout" -Headers $auth
```

Every device (log in first, since the session above has ended):

```powershell
$login = Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'principal.sunrise@demo.school-erp.test'; password = $pw } | ConvertTo-Json); $auth = @{ Authorization = "Bearer $($login.accessToken)" }
```

```powershell
Invoke-RestMethod -Method Post "$api/auth/logout-all" -Headers $auth
```

## 9. Rate limits

Five wrong passwords for one phone/email within 15 minutes, then even the right password gets `429 too_many_requests` (try with a demo teacher so the principal stays usable):

```powershell
1..5 | ForEach-Object { Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'arjun.teacher@demo.school-erp.test'; password = 'wrong-password-1' } | ConvertTo-Json) } }
```

```powershell
Show-ApiError { Invoke-RestMethod -Method Post "$api/auth/login" -ContentType 'application/json' -Body (@{ identifier = 'arjun.teacher@demo.school-erp.test'; password = $pw } | ConvertTo-Json) }
```

The block lifts by itself after 15 minutes, or restart the API (limits are in memory for now).

## 10. Audit log

What was recorded (runs as the database superuser inside the container):

```powershell
docker compose exec -T postgres psql -U postgres -d school_erp -c "SELECT created_at, action, actor_user_id, target_id, ip FROM audit_logs ORDER BY created_at DESC LIMIT 15;"
```
