export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route paiement SasPay
    if (url.pathname === "/api/create-payment") {
      if (request.method !== "POST") {
        return Response.json({ ok: true, message: "create-payment actif, utilise POST" });
      }
      try {
        const body = await request.json();
        const amount = Number(body.amount || 1000);
        const currency = body.currency || "XAF";
        const reference = "CVPRO-" + Date.now();
        const origin = url.origin;

        if (!env.SASPAY_SECRET_KEY) {
          return Response.json({ error: "Clé SasPay manquante" }, { status: 500 });
        }

        const res = await fetch("https://api.saspay.me/v1/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + env.SASPAY_SECRET_KEY
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            reference: reference,
            description: "CV Pro - " + (body.model || "Premium"),
            return_url: origin + "/?payment=success&reference=" + reference,
            cancel_url: origin + "/?payment=cancel",
            customer: {
              name: body.name || "Client",
              email: body.email || "client@example.com",
              phone: body.phone || ""
            },
            metadata: { model: body.model || "" }
          })
        });

        const data = await res.json();
        const checkout_url = data.checkout_url || data.url || data.payment_url;

        if (!res.ok || !checkout_url) {
          return Response.json({ error: data.message || data.error || "SasPay error", details: data }, { status: 400 });
        }

        return Response.json({ checkout_url, reference });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    }

    // Route webhook SasPay - on la gérera juste après
    if (url.pathname === "/api/webhook-saspay") {
      return Response.json({ ok: true, message: "webhook actif" });
    }

    // Sinon, on affiche le site normal
    return env.ASSETS.fetch(request);
  }
};
