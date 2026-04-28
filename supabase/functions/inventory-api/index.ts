// Inventory API — public read + protected admin write
// Path layout (mounted under /inventory-api):
//   GET    /inventory                     -> list visible pianos (flat)
//   GET    /inventory/:inventory_id       -> one piano with detail (respects visibility flags)
//   GET    /inventory/:inventory_id/photos
//   PATCH  /inventory/:inventory_id       -> protected admin write (requires INVENTORY_API_KEY_WRITE)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WRITE_KEY = Deno.env.get("INVENTORY_API_KEY_WRITE") ?? "";

const ALLOWED_ORIGINS = new Set([
  "https://nickspianoservices.com",
  "https://www.nickspianoservices.com",
  "https://nickspianoservices.lovable.app",
  "https://nworkshop.nickspianoservices.com",
  "https://pianorenovationlog.lovable.app",
]);

// Preview pattern for the NicksPianoServices Lovable project only.
// Matches hosts like:
//   id-preview--6b47c1eb-36db-498e-8757-fee96393607f.lovable.app
//   preview--6b47c1eb-36db-498e-8757-fee96393607f.lovable.app
//   6b47c1eb-36db-498e-8757-fee96393607f.lovable.app
const NPS_PREVIEW_PROJECT_ID = "6b47c1eb-36db-498e-8757-fee96393607f";
const NPS_PREVIEW_HOST_RE = new RegExp(
  `^(?:[a-z0-9-]+--)?${NPS_PREVIEW_PROJECT_ID}\\.lovable\\.app$`,
  "i",
);

function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return NPS_PREVIEW_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const allowed = origin && isOriginAllowed(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Max-Age": "86400",
  };
}

const dbHeaders = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function dbGet(table: string, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: dbHeaders });
  if (!res.ok) throw new Error(`DB GET ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function dbPatch(table: string, query: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH", headers: dbHeaders, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DB PATCH ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function dbInsert(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: dbHeaders, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DB INSERT ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function errorResponse(code: string, message: string, status: number, origin: string | null) {
  return jsonResponse({ error: { code, message } }, status, origin);
}

// ---------- Photos helpers ----------

async function getPhotosForPianoIds(pianoIds: string[]) {
  if (!pianoIds.length) return new Map<string, any[]>();
  const inList = pianoIds.map((id) => `"${id}"`).join(",");
  const rows = await dbGet(
    "piano_photos",
    `piano_id=in.(${inList})&order=is_primary.desc,sort_order.asc,created_at.asc&select=id,piano_id,url,caption,category,is_primary,sort_order`,
  );
  const grouped = new Map<string, any[]>();
  for (const r of rows) {
    const arr = grouped.get(r.piano_id) ?? [];
    arr.push(r);
    grouped.set(r.piano_id, arr);
  }
  return grouped;
}

function pickHero(photos: any[] | undefined): string | null {
  if (!photos || !photos.length) return null;
  const primary = photos.find((p) => p.is_primary);
  return (primary ?? photos[0]).url ?? null;
}

// ---------- Shapers ----------

function shapeListItem(piano: any, cat: any, heroUrl: string | null) {
  const saleType = piano.sale_type ?? "internal_inventory";
  return {
    inventory_id: piano.inventory_id,
    piano_id: piano.id,
    brand: piano.brand,
    model: piano.model ?? "",
    year: piano.year_built ?? "",
    finish: piano.finish ?? "",
    piano_type: piano.piano_type,
    status: piano.status,
    asking_price: piano.asking_price ?? null,
    price_display: cat?.price_display ?? "",
    hero_photo_url: heroUrl,
    public_description: cat?.public_description ?? "",
    highlights: cat?.highlights ?? [],
    visible: !!cat?.visible,
    sale_type: saleType,
    is_consignment: saleType === "consignment",
  };
}

async function shapeDetail(piano: any, cat: any, photos: any[]) {
  const detail: Record<string, unknown> = {
    ...shapeListItem(piano, cat, pickHero(photos)),
    country_of_origin: piano.country_of_origin ?? "",
    bench_included: !!piano.bench_included,
    show_restoration_notes: !!cat?.show_restoration_notes,
    public_restoration_note: cat?.public_restoration_note ?? "",
    show_labor_hours: !!cat?.show_labor_hours,
    show_task_list: !!cat?.show_task_list,
    show_cost_breakdown: !!cat?.show_cost_breakdown,
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      category: p.category,
      is_primary: !!p.is_primary,
    })),
  };

  // Tasks + labor hours
  const tasks: any[] = await dbGet(
    "restoration_tasks",
    `piano_id=eq.${piano.id}&select=id,title,category,status,labor_hours,completion_date&order=category.asc`,
  );
  const completed = tasks.filter((t) => t.status === "done");
  const totalHours = completed.reduce((sum, t) => sum + (Number(t.labor_hours) || 0), 0);

  if (cat?.show_labor_hours) {
    detail.total_labor_hours = totalHours;
  }
  if (cat?.show_task_list) {
    detail.completed_tasks = completed.map((t) => ({
      title: t.title,
      category: t.category,
      labor_hours: Number(t.labor_hours) || 0,
      completion_date: t.completion_date,
    }));
  }

  if (cat?.show_cost_breakdown) {
    const expenses = await dbGet(
      "expenses",
      `piano_id=eq.${piano.id}&select=parts_cost,moving_cost,marketing_cost&limit=1`,
    );
    const exp = expenses?.[0] ?? {};
    const settings = await dbGet(
      "app_settings",
      `key=eq.technician_hourly_rate&select=value&limit=1`,
    );
    const rawRate = settings?.[0]?.value;
    const hourlyRate = typeof rawRate === "number" ? rawRate : Number(rawRate) || 0;

    const labor_cost = Math.round(totalHours * hourlyRate);
    const parts_cost = Number(exp.parts_cost) || 0;
    const other_cost = (Number(exp.moving_cost) || 0) + (Number(exp.marketing_cost) || 0);
    detail.cost_breakdown = {
      labor_hours: totalHours,
      labor_cost,
      parts_cost,
      other_cost,
      restoration_investment: labor_cost + parts_cost + other_cost,
    };
  }

  return detail;
}

// ---------- Handlers ----------

// A piano is publicly listable when:
//   - sale_type != 'not_for_sale', AND
//   - ownership is not client_piano, OR sale_type = 'consignment'
function isPubliclyListable(piano: any): boolean {
  if (!piano) return false;
  const saleType = piano.sale_type ?? "internal_inventory";
  if (saleType === "not_for_sale") return false;
  if (piano.ownership_category === "client_piano" && saleType !== "consignment") return false;
  return true;
}

async function handleList(origin: string | null) {
  const visibleCat: any[] = await dbGet(
    "catalogue",
    `visible=eq.true&select=*`,
  );
  if (!visibleCat.length) return jsonResponse({ data: [] }, 200, origin);

  const pianoIds = visibleCat.map((c) => c.piano_id);
  const inList = pianoIds.map((id) => `"${id}"`).join(",");
  const allPianos: any[] = await dbGet(
    "pianos",
    `id=in.(${inList})&select=id,inventory_id,brand,model,year_built,finish,piano_type,status,asking_price,country_of_origin,bench_included,ownership_category,sale_type&order=inventory_id.asc`,
  );
  const pianos = allPianos.filter(isPubliclyListable);

  const photoMap = await getPhotosForPianoIds(pianos.map((p) => p.id));
  const catByPiano = new Map(visibleCat.map((c) => [c.piano_id, c]));

  const data = pianos.map((p) =>
    shapeListItem(p, catByPiano.get(p.id), pickHero(photoMap.get(p.id))),
  );
  return jsonResponse({ data }, 200, origin);
}

async function findPianoByInventoryId(inventoryId: string) {
  const rows = await dbGet(
    "pianos",
    `inventory_id=eq.${encodeURIComponent(inventoryId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function handleDetail(inventoryId: string, origin: string | null) {
  const piano = await findPianoByInventoryId(inventoryId);
  if (!piano) return errorResponse("not_found", "Piano not found", 404, origin);
  if (!isPubliclyListable(piano)) {
    return errorResponse("not_found", "Piano not found", 404, origin);
  }

  const catRows = await dbGet(
    "catalogue",
    `piano_id=eq.${piano.id}&select=*&limit=1`,
  );
  const cat = catRows?.[0];
  if (!cat || !cat.visible) {
    return errorResponse("not_found", "Piano not found", 404, origin);
  }

  const photoMap = await getPhotosForPianoIds([piano.id]);
  const detail = await shapeDetail(piano, cat, photoMap.get(piano.id) ?? []);
  return jsonResponse({ data: detail }, 200, origin);
}

async function handlePhotos(inventoryId: string, origin: string | null) {
  const piano = await findPianoByInventoryId(inventoryId);
  if (!piano) return errorResponse("not_found", "Piano not found", 404, origin);
  if (!isPubliclyListable(piano)) {
    return errorResponse("not_found", "Piano not found", 404, origin);
  }

  const catRows = await dbGet(
    "catalogue",
    `piano_id=eq.${piano.id}&select=visible&limit=1`,
  );
  if (!catRows?.[0]?.visible) {
    return errorResponse("not_found", "Piano not found", 404, origin);
  }

  const photoMap = await getPhotosForPianoIds([piano.id]);
  const photos = (photoMap.get(piano.id) ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    category: p.category,
    is_primary: !!p.is_primary,
    sort_order: p.sort_order,
  }));
  return jsonResponse({ data: photos }, 200, origin);
}

// Whitelist of writable fields. Split between the two tables.
const PIANO_WRITABLE = new Set(["status", "asking_price"]);
const CATALOGUE_WRITABLE = new Set([
  "visible",
  "price_display",
  "public_description",
  "highlights",
  "public_restoration_note",
  "show_labor_hours",
  "show_task_list",
  "show_cost_breakdown",
  "show_restoration_notes",
]);

async function handleAdminPatch(inventoryId: string, req: Request, origin: string | null) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!WRITE_KEY || !auth.startsWith("Bearer ") || auth.slice(7) !== WRITE_KEY) {
    return errorResponse("unauthorized", "Invalid or missing API key", 401, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("bad_request", "Invalid JSON body", 400, origin);
  }
  if (!body || typeof body !== "object") {
    return errorResponse("bad_request", "Body must be a JSON object", 400, origin);
  }

  const piano = await findPianoByInventoryId(inventoryId);
  if (!piano) return errorResponse("not_found", "Piano not found", 404, origin);

  const pianoUpdates: Record<string, unknown> = {};
  const catalogueUpdates: Record<string, unknown> = {};
  const ignored: string[] = [];

  for (const [k, v] of Object.entries(body)) {
    if (PIANO_WRITABLE.has(k)) pianoUpdates[k] = v;
    else if (CATALOGUE_WRITABLE.has(k)) catalogueUpdates[k] = v;
    else ignored.push(k);
  }

  if (!Object.keys(pianoUpdates).length && !Object.keys(catalogueUpdates).length) {
    return errorResponse(
      "bad_request",
      `No writable fields supplied. Allowed: ${[...PIANO_WRITABLE, ...CATALOGUE_WRITABLE].join(", ")}`,
      400,
      origin,
    );
  }

  // Type coercion / light validation
  if ("asking_price" in pianoUpdates) {
    const v = pianoUpdates.asking_price;
    if (v !== null && typeof v !== "number") {
      return errorResponse("bad_request", "asking_price must be a number or null", 400, origin);
    }
  }
  for (const k of ["visible", "show_labor_hours", "show_task_list", "show_cost_breakdown", "show_restoration_notes"]) {
    if (k in catalogueUpdates && typeof catalogueUpdates[k] !== "boolean") {
      return errorResponse("bad_request", `${k} must be boolean`, 400, origin);
    }
  }
  if ("highlights" in catalogueUpdates && !Array.isArray(catalogueUpdates.highlights)) {
    return errorResponse("bad_request", "highlights must be an array of strings", 400, origin);
  }

  const changedFields: string[] = [];

  if (Object.keys(pianoUpdates).length) {
    pianoUpdates.updated_at = new Date().toISOString();
    await dbPatch("pianos", `id=eq.${piano.id}`, pianoUpdates);
    changedFields.push(...Object.keys(pianoUpdates).filter((k) => k !== "updated_at"));
  }

  if (Object.keys(catalogueUpdates).length) {
    const catRows = await dbGet("catalogue", `piano_id=eq.${piano.id}&select=id&limit=1`);
    catalogueUpdates.updated_at = new Date().toISOString();
    if (catRows?.[0]) {
      await dbPatch("catalogue", `piano_id=eq.${piano.id}`, catalogueUpdates);
    } else {
      await dbInsert("catalogue", { ...catalogueUpdates, piano_id: piano.id });
    }
    changedFields.push(...Object.keys(catalogueUpdates).filter((k) => k !== "updated_at"));
  }

  // Audit trail
  await dbInsert("activity_log", {
    piano_id: piano.id,
    user_name: "inventory-api",
    action_description: `External API update: ${changedFields.join(", ")}`,
    changed_field: changedFields.join(", "),
    new_value: JSON.stringify({ ...pianoUpdates, ...catalogueUpdates }),
  });

  return jsonResponse(
    { success: true, inventory_id: inventoryId, updated: changedFields, ignored },
    200,
    origin,
  );
}

// ---------- Router ----------

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  try {
    const url = new URL(req.url);
    // Strip the function mount prefix so routing is stable regardless of host path.
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("inventory");
    const route = idx >= 0 ? parts.slice(idx) : parts;
    // route now looks like ["inventory"] | ["inventory", ":id"] | ["inventory", ":id", "photos"]

    if (route[0] !== "inventory") {
      return errorResponse("not_found", "Unknown route", 404, origin);
    }

    if (req.method === "GET" && route.length === 1) {
      return await handleList(origin);
    }
    if (req.method === "GET" && route.length === 2) {
      return await handleDetail(route[1], origin);
    }
    if (req.method === "GET" && route.length === 3 && route[2] === "photos") {
      return await handlePhotos(route[1], origin);
    }
    if (req.method === "PATCH" && route.length === 2) {
      return await handleAdminPatch(route[1], req, origin);
    }

    return errorResponse("method_not_allowed", `${req.method} ${url.pathname} not supported`, 405, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse("internal_error", message, 500, origin);
  }
});
