# Applied targeted setting protection, 9 November 2026

User approved exact row restriction. Versioned reviewed forward/rollback/review artifacts on GitHub branch security/protect-workshop-setting-20261109, commit 138f93a92aca3097c05de16750007ae1cedb6740, tree a1334c192bc0f985d3e93a1ec31d3e22620d827d. Main unchanged; no frontend deployment or Lovable AI assistant invocation.

Applied forward SQL in a bounded transaction through direct source database connector. Success confirmed separately by catalog: protect_piano_pilot_read_token is RESTRICTIVE FOR ALL TO anon,authenticated, USING and WITH CHECK exact key exclusion. Existing three policies remain unchanged. No row values read, modified or returned; no accounts, roles, sessions, credentials or unrelated policies changed.

Actual PostgreSQL read-only SET LOCAL ROLE checks (not simulated tokens):
- anon: zero protected rows, one technician_hourly_rate row.
- authenticated: zero protected rows, one technician_hourly_rate row.
- service_role: one protected row, one technician_hourly_rate row.
Queries returned only counts and role names. No secret values fetched. Transactions ended normally. Public browser catalogue loaded ten listing links after change. Local model suite independently passed 10/10. No live write/upsert/rename tests attempted; operation semantics remain reviewed policy plus model coverage, not destructive production testing.

Rollback SQL retained but NOT executed. Removing restriction would reopen exposure and needs separate approval. Credential validity/issuer remains unknown; restriction cannot recall prior exposure or revoke a token. Rotation/revocation requires separate identification and authorization. Live legacy identities remain unchanged.
