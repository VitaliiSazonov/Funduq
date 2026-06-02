const https = require('https');
https.get('https://www.funduq.ae/ru/villas/luxury-4bhkmaids-private-beach-and-pool-access-103fbc80-b1b4-4589-9657-fa7ef2d068dc', (res) => {
let data = '';
res.on('data', chunk => data += chunk);
res.on('end', () => {
const gtmScript = data.includes('GTM-WQ7QDB86');
const gtmNoscript = data.includes('googletagmanager.com/ns.html?id=GTM-WQ7QDB86');
const awKept = data.includes('AW-18163609312');
console.log('GTM script tag present:', gtmScript ? 'YES' : 'NO');
console.log('GTM noscript iframe present:', gtmNoscript ? 'YES' : 'NO');
console.log('Old AW-18163609312 still in code:', awKept ? 'YES' : 'NO');
});
});
