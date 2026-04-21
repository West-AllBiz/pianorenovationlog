const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function dbGet(table: string, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`DB GET ${table} failed: ${await res.text()}`);
  return res.json();
}

async function dbPatch(table: string, query: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH", headers, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DB PATCH ${table} failed: ${await res.text()}`);
  return res.json();
}

async function dbInsert(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DB INSERT ${table} failed: ${await res.text()}`);
  return res.json();
}

async function findPianoByInventoryId(inventoryId: string) {
  const rows = await dbGet("pianos", `inventory_id=eq.${encodeURIComponent(inventoryId)}&limit=1`);
  if (!rows.length) throw new Error(`Piano ${inventoryId} not found`);
  return rows[0];
}

// --- Tool handlers ---

async function listPianos() {
  const rows = await dbGet("pianos", "order=inventory_id.asc&select=inventory_id,brand,piano_type,status,lane,finish_plan,finish,percent_complete,roi_health,tag,ownership_category,purchase_price,asking_price");
  return rows;
}

async function getPiano(params: { inventory_id: string }) {
  const piano = await findPianoByInventoryId(params.inventory_id);
  const id = piano.id;
  const [tasks, expenses, clients] = await Promise.all([
    dbGet("restoration_tasks", `piano_id=eq.${id}&order=category.asc`),
    dbGet("expenses", `piano_id=eq.${id}`),
    dbGet("client_records", `piano_id=eq.${id}`),
  ]);
  return { ...piano, restoration_tasks: tasks, expenses, client_records: clients };
}

async function updatePiano(params: Record<string, unknown>) {
  const { inventory_id, ...fields } = params;
  const piano = await findPianoByInventoryId(inventory_id as string);

  const updateFields: Record<string, unknown> = {};
  const allowedKeys = ["status", "lane", "finish_plan", "finish", "percent_complete", "private_notes", "tag", "asking_price", "roi_health"];
  for (const k of allowedKeys) {
    if (fields[k] !== undefined) updateFields[k] = fields[k];
  }
  if (!Object.keys(updateFields).length) throw new Error("No valid fields to update");

  updateFields.updated_at = new Date().toISOString();
  await dbPatch("pianos", `id=eq.${piano.id}`, updateFields);

  const changedNames = Object.keys(updateFields).filter(k => k !== "updated_at");
  const changedValues: Record<string, unknown> = {};
  for (const k of changedNames) changedValues[k] = updateFields[k];

  await dbInsert("activity_log", {
    action_description: `Claude session update: ${changedNames.join(", ")}`,
    piano_id: piano.id,
    user_name: "Claude",
    changed_field: changedNames.join(", "),
    new_value: JSON.stringify(changedValues),
  });

  return { success: true, updated: changedNames, inventory_id };
}

async function getTasks(params: { inventory_id: string }) {
  const piano = await findPianoByInventoryId(params.inventory_id);
  const tasks = await dbGet("restoration_tasks", `piano_id=eq.${piano.id}&order=category.asc`);
  const grouped: Record<string, unknown[]> = {};
  for (const t of tasks) {
    const cat = t.category || "other";
    (grouped[cat] ??= []).push(t);
  }
  return grouped;
}

async function updateTask(params: Record<string, unknown>) {
  const { task_id, ...fields } = params;
  if (!task_id) throw new Error("task_id required");

  const updateFields: Record<string, unknown> = {};
  for (const k of ["status", "notes", "labor_hours", "completion_date"]) {
    if (fields[k] !== undefined) updateFields[k] = fields[k];
  }
  updateFields.updated_at = new Date().toISOString();

  await dbPatch("restoration_tasks", `id=eq.${task_id}`, updateFields);

  // Get task to find piano_id
  const taskRows = await dbGet("restoration_tasks", `id=eq.${task_id}&limit=1`);
  const pianoId = taskRows[0]?.piano_id;

  await dbInsert("activity_log", {
    action_description: "Task updated by Claude",
    piano_id: pianoId || null,
    user_name: "Claude",
    changed_field: Object.keys(updateFields).filter(k => k !== "updated_at").join(", "),
    new_value: JSON.stringify(updateFields),
  });

  return { success: true, task_id, updated: Object.keys(updateFields).filter(k => k !== "updated_at") };
}

async function listFeedback(params: Record<string, unknown> = {}) {
  const limit = Math.min(Number(params.limit ?? 50), 200);
  const queryParts: string[] = [
    "select=*",
    "order=created_at.desc",
    `limit=${limit}`,
  ];

  if (params.min_rating !== undefined) {
    queryParts.push(`rating=gte.${Number(params.min_rating)}`);
  }
  if (params.max_rating !== undefined) {
    queryParts.push(`rating=lte.${Number(params.max_rating)}`);
  }
  if (params.has_comment === true) {
    queryParts.push("comment=not.is.null");
    queryParts.push("comment=neq.");
  }
  if (params.since_days !== undefined) {
    const sinceIso = new Date(Date.now() - Number(params.since_days) * 86400000).toISOString();
    queryParts.push(`created_at=gte.${encodeURIComponent(sinceIso)}`);
  }

  return await dbGet("rk_feedback", queryParts.join("&"));
}

async function addNote(params: { inventory_id: string; note: string }) {
  const piano = await findPianoByInventoryId(params.inventory_id);
  const now = new Date().toISOString();
  await dbInsert("activity_log", {
    action_description: params.note,
    piano_id: piano.id,
    user_name: "Claude",
    created_at: now,
  });
  return { success: true, inventory_id: params.inventory_id, timestamp: now };
}

// --- Tool definitions ---

const TOOLS = [
  { name: "list_pianos", description: "Get full inventory snapshot of all pianos", inputSchema: { type: "object", properties: {} } },
  { name: "get_piano", description: "Get full detail on one piano including tasks, expenses, and client record", inputSchema: { type: "object", properties: { inventory_id: { type: "string", description: "The piano inventory ID e.g. P-008" } }, required: ["inventory_id"] } },
  { name: "update_piano", description: "Update piano fields and auto-log the change to activity_log", inputSchema: { type: "object", properties: { inventory_id: { type: "string" }, status: { type: "string" }, lane: { type: "string" }, finish_plan: { type: "string" }, finish: { type: "string" }, percent_complete: { type: "integer" }, private_notes: { type: "string" }, tag: { type: "string" }, asking_price: { type: "number" }, roi_health: { type: "string" } }, required: ["inventory_id"] } },
  { name: "get_tasks", description: "Get all restoration tasks for a piano grouped by category", inputSchema: { type: "object", properties: { inventory_id: { type: "string" } }, required: ["inventory_id"] } },
  { name: "update_task", description: "Update a restoration task status and log the change", inputSchema: { type: "object", properties: { task_id: { type: "string", description: "UUID of the task" }, status: { type: "string", description: "todo, in_progress, or done" }, notes: { type: "string" }, labor_hours: { type: "number" }, completion_date: { type: "string", description: "ISO date string" } }, required: ["task_id"] } },
  { name: "add_note", description: "Append a dated session note to a piano without changing any fields", inputSchema: { type: "object", properties: { inventory_id: { type: "string" }, note: { type: "string" } }, required: ["inventory_id", "note"] } },
];

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { method, params, id: reqId } = body;

    let result: unknown;

    if (method === "initialize") {
      result = {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "mcp-piano", version: "1.0.0" },
      };
    } else if (method === "tools/list") {
      result = { tools: TOOLS };
    } else if (method === "tools/call") {
      const toolName = params?.name;
      const toolParams = params?.arguments ?? {};

      let toolResult: unknown;
      switch (toolName) {
        case "list_pianos": toolResult = await listPianos(); break;
        case "get_piano": toolResult = await getPiano(toolParams); break;
        case "update_piano": toolResult = await updatePiano(toolParams); break;
        case "get_tasks": toolResult = await getTasks(toolParams); break;
        case "update_task": toolResult = await updateTask(toolParams); break;
        case "add_note": toolResult = await addNote(toolParams); break;
        default: throw new Error(`Unknown tool: ${toolName}`);
      }

      result = { content: [{ type: "text", text: JSON.stringify(toolResult) }] };
    } else {
      return new Response(JSON.stringify({
        jsonrpc: "2.0", id: reqId ?? null,
        error: { code: -32601, message: `Unknown method: ${method}` },
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ jsonrpc: "2.0", id: reqId ?? null, result }), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({
      jsonrpc: "2.0", id: null,
      error: { code: -32000, message },
    }), { headers: corsHeaders });
  }
});
