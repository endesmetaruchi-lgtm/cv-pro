export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json();
    const reference = "CV" + Date.now();
    return Response.json({
      checkout_url: "https://link.saspay.me/jqelvk4atsq",
      reference: reference,
      amount: body.amount || 1000
    });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
