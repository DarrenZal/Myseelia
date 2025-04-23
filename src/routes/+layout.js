// src/routes/+layout.js

// This forces client-side rendering (CSR) only.
// Necessary for adapter-static to work correctly with hash routing on static hosts like GitHub Pages or IPFS.
export const ssr = false;

// You can still have load functions if needed, but they will only run on the client.
// export async function load({ fetch }) {
//   ...
// }
