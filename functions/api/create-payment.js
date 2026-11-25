export async function onRequest(context) {
  const { request, env } = context;
  const body = await request.json();
  const phone = body.phone_number || body.phone || "24176200735";
  const res = await fetch("https://api.saspay.me/api/v1/payments/softpay/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SASPAY_SECRET_KEY },
    body: JSON.stringify({
      amount: Number(body.amount || 1000),
      currency: "XAF",
      country: "GA",
      phone_number: phone,
      method: "airtel_money",
      reference: "CVPRO-" + Date.now(),
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
    return Response.json({ error: "SasPay error DETAIL: " + JSON.stringify(data) }, { status: 400 });
  }
  return Response.json(data);
}
