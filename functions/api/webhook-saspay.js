export async function onRequest(context) {
  try {
    const data = await context.request.json();
    console.log("Webhook SasPay reçu:", data);
  } catch (e) {
    // SasPay peut envoyer du texte, on ignore
  }
  return new Response("OK", { status: 200 });
}
