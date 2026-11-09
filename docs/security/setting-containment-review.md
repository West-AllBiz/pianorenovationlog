# Exact setting-row containment review

Local draft only. No production statement or external action was executed, and no setting value was read.

## Result

The proposed restrictive FOR ALL policy for anon and authenticated, with identical USING and WITH CHECK predicates on the exact key, is an appropriate minimal containment of ordinary RLS-governed row access. Existing permissive true policies cannot override the restrictive predicate. It does not grant access to other settings; their existing policies/grants still apply. Actual service_role/BYPASSRLS access remains unchanged.

10/10 offline model tests pass. They cover both runtime roles, all four operations, renaming protected→ordinary and ordinary→protected, ordinary settings preservation, restrictive composition, upsert/RETURNING, service bypass, NULL semantics and TRUNCATE exclusion. This is not PostgreSQL/PostgREST integration verification. Forward and rollback SQL files are explicitly marked DRAFT-NOT-EXECUTED; they include bounded locking, transactional metadata assertions and no value selection.

## Operation semantics

- SELECT filters the protected row, including value-only queries, count/embedding paths that actually evaluate this table's RLS, and ordinary joins. Expect zero visible rows rather than necessarily an error.
- UPDATE/DELETE USING prevents targeting the protected old row. Consequently it cannot be renamed away to expose its value or deleted through those normal paths. A bulk operation can still affect allowed ordinary rows; do not expect its whole statement to fail merely because a protected old row is filtered out.
- INSERT and UPDATE WITH CHECK reject a new row bearing the protected key, including renaming an ordinary row into it. A violating new-row check aborts that statement. Both predicates are necessary.
- INSERT ... ON CONFLICT retains INSERT/UPDATE policy checks; upsert is not a bypass. RETURNING adds visibility requirements rather than granting access. The offline model captures the intended allow/deny contract, not every executor/error/constraint-order detail; synthetic PostgreSQL tests must verify plain insert, DO NOTHING, DO UPDATE, bulk operations and RETURNING before claiming runtime coverage.
- IS DISTINCT FROM is a definite boolean even for NULL. A NULL key is distinct from the protected text, but the existing primary-key NOT NULL constraint independently prevents such a write. The policy uses the column's actual text/collation semantics; the offline string model assumes ordinary case-sensitive text comparison. Other aliases/copies/keys containing the same value are outside this one-key scope.

## Limitations and risks

1. Treat this value as potentially exposed because metadata confirms public SELECT access, without claiming someone fetched it. Containment cannot recall earlier responses, logs, caches, downloads, backups or copies. It does not rotate/revoke the token.
2. No assumption is made that this setting is the separate inventory WRITE_KEY. Identify consumers from code/config metadata without reading the value. If it authorizes another service, supported rotation/revocation needs its own scoped approval and capability.
3. Policy checks do not govern privileged SECURITY DEFINER readers, table owners, BYPASSRLS/service-role queries, existing independent edge APIs or TRUNCATE. They do not automatically secure views, other schemas, Realtime payloads/cached authorizations, signed/public URLs or previously issued credentials. Table grants still exist. No confirmed exposed privileged reader for this key is assumed here.
4. Statements/transactions already running may retain an earlier snapshot. Client and intermediary caches can still contain earlier content. No instant global revocation claim is justified.
5. Frontend source currently consumes technician_hourly_rate only, per parent's review; it should remain readable under its existing policy. That finding does not establish that all other clients/integrations ignore the protected key.
6. The forward script aborts on an existing policy name rather than blindly replacing it. Inspect an uncertain prior outcome before retrying. Its postcheck verifies catalog shape, not complete runtime-role behavior. Neither draft has been parsed/executed by a PostgreSQL instance here.
7. Removing this policy re-exposes the row under the existing broad policies. The rollback draft is deliberately not an automatic recovery instruction. Check the exact installed expression against the approved artifact and later changes before any separately approved rollback; prefer retaining the gate and repairing the consumer.

## Precise approval scope

Approve adding only policy protect_piano_pilot_read_token on public.app_settings, RESTRICTIVE FOR ALL TO anon,authenticated, USING and WITH CHECK key IS DISTINCT FROM the exact protected key. No row/value changes, token reads/rotation, role/account/session changes, frontend deployment, broad grant revocation, inventory API changes or Lovable-credit work are included. Preserve privileged service behavior and all other rows.

After the reviewed change, metadata-only checks can confirm the installed policy, roles and predicates. Do not retrieve the actual value as a test. Validate value exclusion and rename/upsert/RETURNING semantics in an isolated synthetic database fixture; check that technician_hourly_rate remains available under the intended role without exposing unrelated data. Separate any future token rotation from this containment approval.
