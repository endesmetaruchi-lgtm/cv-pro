export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return Response.json({ ok: true, message: "create-payment actif" });
  }
  const { request, env } = context;
  try {
    const body = await request.json();
    if (!env.SASPAY_SECRET_KEY) {
      return Response.json({ error: "Clé SasPay manquante dans Cloudflare" }, { status: 500 });
    }
    const reference = "CVPRO-" + Date.now();
    const origin = new URL(request.url).origin;

    const res = await fetch("https://api.saspay.me/api/v1/payments/softpay/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + env.SASPAY_SECRET_KEY 
      },
      body: JSON.stringify({ 
        amount: Number(body.amount || 1000), 
        currency: body.currency || "XAF", 
        reference: reference,
        description: "CV Pro Gabon",
        success_url: origin + "/?payment=success&reference=" + reference,
        cancel_url: origin + "/?payment=cancel",
        return_url: origin + "/?payment=success&reference=" + reference
      })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { 
      return Response.json({ error: "SasPay a répondu en HTML, pas JSON", status: res.status, body: text.slice(0, 500) }, { status: 502 }); 
    }
    const checkout_url = data.checkout_url || data.url || data.payment_url || data.data?.url;
    if (!res.ok || !checkout_url) return Response.json({ error: data.message || "SasPay error", details: data }, { status: 400 });
    return Response.json({ checkout_url, reference });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
