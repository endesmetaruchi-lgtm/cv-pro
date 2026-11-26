export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const amount = body.amount || 1000;
    const reference = "CV" + Date.now();

    const payload = {
      amount: amount,
      currency: "XAF",
      description: "Paiement CV Pro Gabon",
      reference: reference,
      customer_email: body.email || "client@cv-gabon.ga",
      customer_name: body.nom || "Client",
      return_url: "https://cv-pro.pages.dev/?payment=success&reference=" + reference,
      cancel_url: "https://cv-pro.pages.dev/",
      notification_url: "https://cv-pro.pages.dev/api/notification"
    };

    const urls = [
      "https://api.saspay.me/v1/payments/checkout-create/",
      "https://api.saspay.me/v1/payments/checkout/",
      "https://api.saspay.me/v1/checkout/",
      "https://api.saspay.me/v1/payment-links/",
      "https://api.saspay.me/v1/payments/link/"
    ];

    let logs = "";
    for (const url of urls) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(env.SASPAY_KEY_ID + ":" + env.SASPAY_SECRET_KEY)}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      logs += url + " [" + res.status + "] " + text.slice(0,120) + " | ";
      if (res.ok) {
        return Response.json(JSON.parse(text));
      }
    }
    return Response.json({ error: logs }, { status: 500 });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
