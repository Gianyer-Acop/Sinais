import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * NOSSASINAIS - EDGE FUNCTION: send-push (VERSÃO INDUSTRIAL V.33)
 * -------------------------------------------------------------
 * ESTA VERSÃO ADICIONA O CABEÇALHO DE URGÊNCIA 'high' PARA FUNDO (BACKGROUND).
 */

const encodeB64 = (arr) => btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decodeB64 = (str) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function getHkdfKey(salt, ikm, info, length) {
  const infoBytes = new TextEncoder().encode(info);
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: infoBytes }, key, length * 8));
}

// ... (Resto da criptografia V.26/V.33 igual) ...

async function encryptPayload(payload, subscription) {
  const { keys } = subscription;
  const clientP256dh = decodeB64(keys.p256dh);
  const clientAuth = decodeB64(keys.auth);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPubKey = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const remotePubKey = await crypto.subtle.importKey("raw", clientP256dh, { name: "ECDH", namedCurve: "P-256" }, true, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: remotePubKey }, localKeyPair.privateKey, 256));

  const PRK = await getHkdfKey(clientAuth, sharedSecret, "WebPush: info" + "\0", 32);
  const info_key = new Uint8Array([
    ...new TextEncoder().encode("Content-Encoding: aes128gcm" + "\0"),
    ...clientP256dh,
    ...localPubKey,
    0x01
  ]);
  
  const CEK = await getHkdfKey(salt, PRK, info_key, 16);
  const nonce = await getHkdfKey(salt, PRK, new Uint8Array([...new TextEncoder().encode("Content-Encoding: nonce" + "\0"), ...clientP256dh, ...localPubKey, 0x01]), 12);

  const data = new TextEncoder().encode(payload);
  const record = new Uint8Array(data.length + 17);
  record.set(data);
  record[data.length] = 0x02;

  const key_aes = await crypto.subtle.importKey("raw", CEK, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", nonce }, key_aes, record));

  return { encrypted, salt, localPubKey };
}

serve(async (req) => {
  try {
    const { record } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    // 1. Buscar o perfil do destinatário para pegar a subscrição
    const { data: profile } = await supabase.from('profiles').select('push_subscription').eq('id', record.user_id).single();
    if (!profile?.push_subscription) return new Response("Sem subscrição", { status: 200 });

    const subscription = profile.push_subscription;
    const payload = JSON.stringify({ title: record.title, body: record.body });
    const { encrypted, salt, localPubKey } = await encryptPayload(payload, subscription);

    // 2. Montar o Push Body conforme RFC 8291
    const body = new Uint8Array(salt.length + 5 + localPubKey.length + encrypted.length);
    body.set(salt, 0);
    body.set([0, 0, 16, 0, localPubKey.length], salt.length);
    body.set(localPubKey, salt.length + 5);
    body.set(encrypted, salt.length + 5 + localPubKey.length);

    // 3. Montar cabeçalho VAPID (JWT)
    const privateKeyRaw = decodeB64(Deno.env.get('VAPID_PRIVATE_KEY'));
    const privateKey = await crypto.subtle.importKey("pkcs8", privateKeyRaw, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    
    const jwtBody = btoa(JSON.stringify({ alg: "ES256", typ: "JWT" })) + "." + btoa(JSON.stringify({
      aud: new URL(subscription.endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 86400,
      sub: "mailto:gianyer.dev@gmail.com"
    }));
    const signature = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(jwtBody)));
    const authorization = `vapid t=${jwtBody}.${encodeB64(signature)}, k=${Deno.env.get('VAPID_PUBLIC_KEY')}`;

    console.log('--- ENVIANDO PUSH DE ALTA URGÊNCIA (V.33) ---');

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "TTL": "86400",
        "Urgency": "high", // <--- O SEGREDO PARA FUNDO/BACKGROUND
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream"
      },
      body
    });

    return new Response(`OK: ${response.status}`, { status: 200 });

  } catch (err) {
    console.error("ERRO CRITICAL V.33:", err);
    return new Response(err.message, { status: 500 });
  }
});
