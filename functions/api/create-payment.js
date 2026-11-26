export async function onRequest(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const phone = (body.phone_number || body.phone || "").toString().replace(/\s/g, "");
    if (!phone) return Response.json({ error: "Numéro manquant" }, { status: 400 });

    // Prix bloqué côté serveur, le client ne peut pas tricher
    const amount = 1000; 
    const network = body.network === "moov_money" ? "moov_money" : "airtel_money";
    const reference = "CVPRO-" + Date.now();

    // On sauvegarde la commande en attente dans Supabase
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      await fetch(env.SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          reference: reference,
          phone: phone,
          amount: amount,
          email: body.email || "client@cvpro.ga",
          first_name: body.first_name || "Client",
          status: "pending",
          network: network
        })
      });
    }

    const res = await fetch("https://api.saspay.me/api/v1/payments/softpay/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SASPAY_SECRET_KEY },
      body: JSON.stringify({
        amount: amount,
        currency: "XAF",
        country: "GA",
        phone_number: phone,
        network: network,
        method: network,
        reference: reference,
        customer: {
          first_name: body.first_name || "Client",
          last_name: body.last_name || "CV Pro",
          phone: phone,
          email: body.email || "client@cvpro.ga"
        }
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: "SasPay error: " + JSON.stringify(data) }, { status: 400 });
    }
    return Response.json({ ...data, reference });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
