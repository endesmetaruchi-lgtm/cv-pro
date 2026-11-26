export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const phone = (body.phone || '').replace(/\s/g, '');
    const email = body.email || '';
    const name = body.name || 'Client CV Pro';
    const model = body.model || 1;
    if (!phone || phone.length < 8) {
      return new Response(JSON.stringify({ error: 'Numero invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const reference = 'CVPRO-' + Date.now() + '-' + Math.floor(Math.random()*100000);
    const amountStr = "1000.00";

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      await fetch(env.SUPABASE_URL + '/rest/v1/orders', {
        method: 'POST',
        headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ reference, amount: 1000, currency: 'XAF', phone, email, name, model, status: 'pending' })
      });
    }

    const payload = {
      amount: amountStr,
      currency: "XAF",
      reference: reference,
      description: "Paiement CV Pro Gabon - Modele " + model,
      callback_url: "https://cv-pro.pages.dev/?payment=success&reference=" + reference,
      webhook_url: "https://cv-pro.pages.dev/api/webhook-saspay",
      customer: { name: name, email: email, phone: phone },
      metadata: { model: String(model), source: "cv-pro" }
    };

    const res = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
        'Idempotency-Key': reference
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return new Response(JSON.stringify({ error: 'SasPay reponse invalide: ' + text }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const checkout_url = data.checkout_url || data.checkoutUrl || (data.data && (data.data.checkout_url || data.data.checkoutUrl));

    if (!checkout_url) {
      return new Response(JSON.stringify({ error: 'Pas de checkout_url SasPay', data: data, status: res.status }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, reference, checkout_url }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
