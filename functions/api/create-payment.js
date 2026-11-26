export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const amount = body.amount || 1000;
    const phone = (body.phone || '').replace(/\s/g, '');
    const email = body.email || '';
    const name = body.name || 'Client CV Pro';
    const model = body.model || 1;

    if (!phone || phone.length < 8) {
      return Response.json({ error: 'Numéro invalide' }, { status: 400 });
    }

    const reference = 'CVPRO-' + Date.now() + '-' + Math.floor(Math.random() * 100000);

    // 1. Créer la commande dans Supabase
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(supabaseUrl + '/rest/v1/orders', {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          reference: reference,
          amount: amount,
          currency: 'XAF',
          phone: phone,
          email: email,
          name: name,
          model: model,
          status: 'pending'
        })
      });
    }

    // 2. Créer le paiement SasPay SANS forcer airtel_money
    const saspayKey = env.SASPAY_API_KEY;
    const saspaySecret = env.SASPAY_SECRET_KEY;

    const payload = {
      amount: amount,
      currency: 'XAF',
      reference: reference,
      description: 'Paiement CV Pro Gabon - Modele ' + model,
      callback_url: 'https://cv-pro.pages.dev/?payment=success&reference=' + reference,
      webhook_url: 'https://cv-pro.pages.dev/api/webhook-saspay',
      customer: {
        name: name,
        email: email,
        phone: phone
      }
      // PAS de payment_method ici, on laisse SasPay choisir
    };

    const res = await fetch('https://api.saspay.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': saspayKey,
        'X-API-Secret': saspaySecret
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      return Response.json({ error: 'SasPay error: ' + JSON.stringify(data) }, { status: 422 });
    }

    const checkout_url = data.checkout_url || data.payment_url || data.url || (data.data && (data.data.checkout_url || data.data.payment_url));

    if (!checkout_url) {
      return Response.json({ error: 'Pas de checkout_url SasPay', data: data }, { status: 500 });
    }

    return Response.json({
      success: true,
      reference: reference,
      checkout_url: checkout_url
    });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
