// Owner-approved emergency shutdown. Restore only after a controlled security review.
// The original implementation is preserved in Git history.
Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
});
