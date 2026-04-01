import crypto from 'crypto';
import fs from 'fs';

// Usar o método ECDH que é mais direto para gerar chaves VAPID (P-256)
const curve = crypto.createECDH('prime256v1');
curve.generateKeys();

const pub = curve.getPublicKey('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const priv = curve.getPrivateKey('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

fs.writeFileSync('VAPID_FINAL_KEY.txt', `PUB=${pub}\nPRIV=${priv}`);
console.log('Chaves geradas com sucesso no arquivo VAPID_FINAL_KEY.txt');
