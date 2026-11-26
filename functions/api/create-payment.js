export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const amount = body.amount || 1000;
    const reference = "CV" + Date.now();

    const res = await fetch("https://api.saspay.me/v1/payments/checkout/", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(env.SASPAY_KEY_ID + ":" + env.SASPAY_SECRET_KEY)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        currency: "XAF",
        description: "Paiement CV Pro Gabon",
        reference: reference,
        customer_email: body.email || "client@cv-gabon.ga",
        customer_name: body.nom || "Client",
        return_url: "https://cv-pro.pages.dev/?payment=success&reference=" + reference,
        cancel_url: "https://cv-pro.pages.dev/",
        notification_url: "https://cv-pro.pages.dev/api/notification"
      })
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return Response.json({ error: "SasPay a renvoyé: " + text.slice(0,200) }, { status: 500 });
    }
    return Response.json(data);
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
