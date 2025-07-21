export function generateCandidate() {
   const prefix = '1';
   let payload = '';
   for (let i = 0; i < 11; i++) payload += Math.floor(Math.random() * 10);
   const base = prefix + payload;
   const checksum = base
     .split('')
     .map(Number)
     .reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
   const digit = (10 - (checksum % 10)) % 10;
   return base + digit;
 }
 