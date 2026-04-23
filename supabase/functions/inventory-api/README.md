# inventory-api

External-facing inventory API for Nick's Piano Workshop.
Reads are public for catalogue-visible pianos. Writes require a bearer key.

## Base URL

```
https://bxurezzzvdnuiiwtaqxw.supabase.co/functions/v1/inventory-api
```

All routes below are relative to that base.

## CORS

Browser calls are accepted only from these origins:

- `https://nickspianoservices.com`
- `https://nworkshop.nickspianoservices.com`
- `https://pianorenovationlog.lovable.app`

Server-to-server calls (no `Origin` header) work from anywhere.

## Auth

- **Read endpoints** — no auth. Only return rows where `catalogue.visible = true`.
- **Write endpoints** — `Authorization: Bearer $INVENTORY_API_KEY_WRITE` (stored as a Lovable Cloud secret).

---

## Endpoints

### `GET /inventory`

List all publicly visible pianos.

```json
{
  "data": [
    {
      "inventory_id": "KIM-1",
      "piano_id": "uuid",
      "brand": "Kimball",
      "model": "Console",
      "year": "1972",
      "finish": "Walnut Satin",
      "piano_type": "upright",
      "status": "ready_for_sale",
      "asking_price": 4500,
      "price_display": "$4,500",
      "hero_photo_url": "https://.../photo.jpg",
      "public_description": "...",
      "highlights": ["Restored hammers", "New strings"],
      "visible": true
    }
  ]
}
```

### `GET /inventory/:inventory_id`

One piano with detail. Returns 404 if not visible.

Includes everything from the list shape plus:

- `country_of_origin`, `bench_included`
- `photos[]` (gallery, ordered by primary then sort_order)
- `total_labor_hours` (only if `show_labor_hours = true`)
- `completed_tasks[]` (only if `show_task_list = true`) — `{title, category, labor_hours, completion_date}`
- `cost_breakdown` (only if `show_cost_breakdown = true`) — `{labor_hours, labor_cost, parts_cost, other_cost, restoration_investment}`
  - `other_cost` = `moving_cost + marketing_cost`
  - Purchase price is **never** exposed.

### `GET /inventory/:inventory_id/photos`

Just the photo gallery for a visible piano.

```json
{ "data": [ { "id": "...", "url": "...", "caption": "...", "category": "restoration", "is_primary": false, "sort_order": 2 } ] }
```

### `PATCH /inventory/:inventory_id`  *(protected)*

```bash
curl -X PATCH \
  -H "Authorization: Bearer $INVENTORY_API_KEY_WRITE" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready_for_sale","asking_price":4500,"visible":true,"price_display":"$4,500"}' \
  https://bxurezzzvdnuiiwtaqxw.supabase.co/functions/v1/inventory-api/inventory/KIM-1
```

**Writable fields**

On `pianos`:
- `status` (string)
- `asking_price` (number | null)

On `catalogue`:
- `visible` (boolean)
- `price_display` (string)
- `public_description` (string)
- `highlights` (string[])
- `public_restoration_note` (string)
- `show_labor_hours` (boolean)
- `show_task_list` (boolean)
- `show_cost_breakdown` (boolean)
- `show_restoration_notes` (boolean)

Any other field in the body is ignored and reported back in `ignored[]`.

Response:

```json
{ "success": true, "inventory_id": "KIM-1", "updated": ["status","asking_price","visible","price_display"], "ignored": [] }
```

Every write is appended to `activity_log` with `user_name = "inventory-api"`.

## Error shape

```json
{ "error": { "code": "not_found", "message": "Piano not found" } }
```

Codes: `not_found` (404), `unauthorized` (401), `bad_request` (400), `method_not_allowed` (405), `internal_error` (500).

## Secrets

- `INVENTORY_API_KEY_WRITE` — bearer token for `PATCH`. Stored in Lovable Cloud secrets.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected.
