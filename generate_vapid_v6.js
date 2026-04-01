const crypto = require('crypto');
const fs = require('fs');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ type: 'spki', format: 'buffer' }).slice(-65).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const priv = privateKey.export({ type: 'pkcs8', format: 'buffer' }).slice(-32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
fs.writeFileSync('VAPID_FINAL_KEY.txt', `PUB=${pub}\nPRIV=${priv}`);
console.log('Chaves geradas no arquivo VAPID_FINAL_KEY.txt');
