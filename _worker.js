export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.includes("create-payment")) {
      if (request.method !== "POST") {
        return Response.json({ ok: true, message: "create-payment actif, utilise POST" });
      }
      // MODE DEBUG : on ne paye pas encore, on répond juste ce qu'on a reçu
      try {
        const body = await request.json();
        return Response.json({ 
          debug_ok: true, 
          pathname: url.pathname,
          method: request.method,
          body_recu: body,
          cle_presents: !!env.SASPAY_SECRET_KEY
        });
      } catch(e) {
        return Response.json({ debug_ok: false, erreur: e.message, pathname: url.pathname });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
