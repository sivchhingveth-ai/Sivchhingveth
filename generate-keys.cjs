const { generateKeyPairSync, createPublicKey } = require('crypto');
const fs = require('fs');

// Generate RSA key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});

// Convert public key to JWK
const pubKey = createPublicKey(publicKey);
const jwk = pubKey.export({ format: 'jwk' });
jwk.use = 'sig';
jwk.kid = 'key-' + Math.random().toString(36).slice(-6);
jwk.alg = 'RS256';

const jwks = JSON.stringify({ keys: [jwk] });

// Save files
fs.writeFileSync('jwt-private.pem', privateKey);
fs.writeFileSync('jwt-public.pem', publicKey);
fs.writeFileSync('jwks.json', jwks);

console.log('\n=== JWT_PRIVATE_KEY ===\n');
console.log(privateKey);
console.log('\n=== JWKS ===\n');
console.log(jwks);
console.log('\nKeys saved to jwt-private.pem, jwt-public.pem, and jwks.json');
