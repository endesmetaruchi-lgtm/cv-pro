export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    let phone = (body.phone || '').replace(/\s/g, '');
    const email = body.email || '';
    const name = body.name || 'Client CV Pro';
    const model = body.model || 1;
    if (!phone || phone.length < 8) {
      return new Response(JSON.stringify({ error: 'Numero invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!phone.startsWith('+')) phone = '+241' + phone.replace(/^0/, '');
    const parts = name.split(' ');
    const first_name = parts[0] || 'Client';
    const last_name = parts.slice(1).join(' ') || 'CVPro';
    const reference = 'CVPRO-' + Date.now();

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      await fetch(env.SUPABASE_URL + '/rest/v1/orders', {
        method: 'POST',
        headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ reference, amount: 1000, currency: 'XAF', phone, email, name, model, status: 'pending' })
      });
    }

    const payload = {
      amount: "1000.00",
      currency: "XAF",
      country: "GA",
      description: "Paiement CV Pro Gabon - Modele " + model,
      customer: {
        email: email || "client@example.com",
        first_name: first_name,
        last_name: last_name,
        phone: phone
      },
      network: "airtel_ga"
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

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, pushed: true, reference, message: data.message || 'Payment pushed successfully', status: data.status || 'PENDING', checkout_url: data.checkout_url || '' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
