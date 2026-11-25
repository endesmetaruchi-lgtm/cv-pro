export async function onRequest(context) {
  const { request, env } = context;
  const body = await request.json();
  const res = await fetch("https://api.saspay.me/api/v1/payments/softpay/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SASPAY_SECRET_KEY },
    body: JSON.stringify({
      amount: Number(body.amount || 1000),
      currency: "XAF",
      phone_number: body.phone_number || body.phone || "",
      network: body.network || "airtel",
      reference: "CVPRO-" + Date.now()
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json({ error: "SasPay error DETAIL: " + JSON.stringify(data) }, { status: 400 });
  }
  return Response.json(data);
}
