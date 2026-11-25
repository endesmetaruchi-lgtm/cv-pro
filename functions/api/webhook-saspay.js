export async function onRequest(context) {
  const { request, env } = context;
  try {
    const data = await request.json().catch(() => ({}));
    console.log("Webhook SasPay reçu:", data);

    // SasPay renvoie reference et status selon l'event
    const reference = data.reference || data.data?.reference || data.transaction?.reference;
    const status = (data.status || data.data?.status || data.transaction?.status || "").toString().toLowerCase();
    const isPaid = status === "success" || status === "paid" || status === "completed" || data.event === "payment.success";

    if (reference && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      await fetch(env.SUPABASE_URL + "/rest/v1/orders?reference=eq." + encodeURIComponent(reference), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ status: isPaid ? "paid" : "failed" })
      });
    }
    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response("OK", { status: 200 });
  }
}
