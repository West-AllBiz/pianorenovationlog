# Workshop migration preparation

The live source is still bxurezzzvdnuiiwtaqxw. No domain, credentials or production database changes are made by this draft.

## Captured October 13, 2026
- Full public records from 17 tables, including 18 pianos, 1,152 restoration tasks and 71 photo records.
- Five Auth account identifiers and profile metadata. Password hashes and provider tokens are excluded.
- Current table definitions, enums, constraints, indexes, functions, triggers, policies and grants.
- All 62 storage objects (193,511,763 bytes). Sizes match source metadata; all 59 available source MD5 checksums match.
- All 61 populated photo URLs resolve to objects in that backup. Ten photo rows have no populated URL and need a storage_path review before switching.
- Private exports and photos are kept outside GitHub.

## Owned destination
An owner-selected Supabase project and its quoted cost are required before provisioning. Keep Workshop as the single source of truth for inventory, restoration state, prices and ordering; the website and Piano Pilot read its inventory API.

1. Provision the destination, apply the reviewed schema and this signup hardening migration.
2. Restore the five accounts with their UUIDs through a supported secure Auth transfer or an explicit UUID map. Do not invent new account IDs while leaving old foreign keys. Password resets or provider reconnection may be required.
3. Restore public rows in dependency order. Preserve existing trusted admin user_roles from the export; profile names do not establish authority.
4. Recreate the public piano-photos bucket, upload all actual objects using the Storage API, rewrite project URLs, and compare hashes/foreign keys/counts.
5. Deploy inventory-api and mcp-piano with their intended authentication. Verify anonymous reads expose only published inventory; test private client/financial reads remain denied.
6. Verify owner login and a permitted edit. Verify the website and Piano Pilot read the same records.
7. Take a final source delta, pause legacy writes briefly, switch the endpoint and host, test, then keep the old source for rollback.

## Signup security change
The old handle_new_user function grants admin when a signup profile full_name is Nick. That metadata is user-controlled. The new migration grants only the existing contributor role to new users and leaves current role rows unchanged. Administrative access must be assigned through a trusted existing admin/server operation. Public signup policy and contributor access require review before production cutover.

Validation: migration reviewed against the exported live function, enum and role policies. It has not been applied to a new hosted destination; run the database signup and RLS checks there before switching.
