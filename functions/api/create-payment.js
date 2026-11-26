export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const amount = body.amount || 1000;
    const res = await fetch("https://api.saspay.com/v1/payments/", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(env.SASPAY_KEY_ID + ":" + env.SASPAY_SECRET_KEY)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        currency: "XAF",
        description: "Paiement CV Pro Gabon - " + (body.nom || ""),
        reference: "CV" + Date.now(),
        customer_email: body.email || "client@cv-gabon.ga",
        customer_name: body.nom || "Client",
        return_url: "https://cv-gabon.pages.dev/?payment=success&reference=CV" + Date.now(),
        cancel_url: "https://cv-gabon.pages.dev/",
        notification_url: "https://cv-gabon.pages.dev/api/notification"
      })
    });
    const data = await res.json();
    return Response.json(data);
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
