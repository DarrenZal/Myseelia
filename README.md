# De-Note

De-Note is a decentralized, end-to-end encrypted note-taking application built with SvelteKit. It demonstrates building modern web applications using standard browser APIs for cryptography and IPFS for decentralized storage, eliminating the need for traditional backend servers for user accounts or data persistence.

## ✨ Features

*   **Passwordless Authentication:** Uses cryptographic key pairs (RSA-OAEP + AES-GCM) generated and stored locally in the browser via the Web Crypto API.
*   **End-to-End Encryption:** Notes are encrypted symmetrically (AES-GCM) before upload. The symmetric key is then encrypted with the user's public RSA key.
*   **Decentralized Storage:** Encrypted note data and metadata are stored on IPFS via the Pinata pinning service.
*   **IPFS User Manifest:** A JSON manifest file, also stored on IPFS, links the user's public key to their encrypted file CIDs and necessary decryption metadata (IVs, encrypted keys).
*   **Device Syncing:** Export account credentials (private key + manifest CID) via a QR code URL to easily log in on another device.
*   **Markdown Editor:** Create and edit notes using a simple Markdown editor with a live preview toggle.

## 🛠️ Technology Stack

*   [SvelteKit](https://kit.svelte.dev/) (powered by [Vite](https://vitejs.dev/))
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [DaisyUI](https://daisyui.com/)
*   [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (Browser Standard)
*   [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (Browser Standard, via `idb` library)
*   [IPFS](https://ipfs.tech/) (via [Pinata](https://www.pinata.cloud/))
*   [marked](https://marked.js.org/) (for Markdown rendering)
*   [DOMPurify](https://github.com/cure53/DOMPurify) (for sanitizing rendered HTML)
*   [qrcode](https://github.com/soldair/node-qrcode) (for device sync QR codes)

*(Note: TerminusDB and Meilisearch related code might still be present in some components but is not core to the De-Note functionality described here).*

## 🚀 Getting Started Locally

Prerequisites: Ensure you have Node.js (v16.14 or later) and npm installed.

1.  **Clone the repository:**
    ```shell
    git clone https://github.com/DarrenZal/Myseelia.git
    cd Myseelia
    ```

2.  **Install dependencies:**
    ```shell
    npm install
    ```

3.  **Set up Pinata:**
    *   Create an account at [Pinata.cloud](https://www.pinata.cloud/).
    *   Create an API Key with **Admin** permissions.
    *   Generate a **JWT** for that Admin API key.
    *   Create a dedicated **Gateway** (e.g., `your-gateway-name.mypinata.cloud`).
    *   Create a `.env` file in the project root.
    *   Add your Pinata credentials to the `.env` file:
        ```dotenv
        VITE_PINATA_JWT=YOUR_PINATA_ADMIN_JWT_HERE
        VITE_PINATA_GATEWAY=YOUR_DEDICATED_GATEWAY_DOMAIN_HERE # e.g., your-gateway-name.mypinata.cloud
        ```
        *(Replace the placeholders with your actual JWT and gateway domain)*

4.  **Start the development server:**
    ```shell
    npm run dev
    ```

5.  Navigate to `http://localhost:5173` (or the port specified) in your browser.

## ☁️ Deploying to Vercel (Recommended)

Vercel is recommended for easy deployment as it handles SPA routing correctly.

1.  **Push to GitHub:** Ensure your latest code is pushed to your GitHub repository.
2.  **Sign up/Login to Vercel:** Use your GitHub account at [vercel.com](https://vercel.com/).
3.  **Import Project:** Add a new project and import your `Myseelia` repository from GitHub.
4.  **Configure Project:**
    *   Vercel should auto-detect SvelteKit.
    *   Verify the Build Command (`npm run build`) and Output Directory (`.svelte-kit/output`).
5.  **Add Environment Variables:**
    *   Go to Project Settings -> Environment Variables.
    *   Add `VITE_PINATA_JWT` with your Pinata Admin JWT value.
    *   Add `VITE_PINATA_GATEWAY` with your Pinata Dedicated Gateway domain (e.g., `your-gateway-name.mypinata.cloud`).
    *   Ensure they are available for the "Production" environment.
6.  **Deploy:** Click the "Deploy" button.

Vercel will build and deploy your site to a unique URL.

## ⚙️ How It Works (High-Level)

1.  **Registration:** When a user registers, the browser generates an RSA key pair using the Web Crypto API. The keys are stored locally in IndexedDB. An initial, empty JSON "manifest" file containing the public key is created and uploaded (pinned) to IPFS via Pinata. The IPFS CID (Content Identifier) of this manifest is stored in the browser's localStorage.
2.  **Login:** On subsequent visits, the app checks for the keys in IndexedDB. If found, the user is considered logged in.
3.  **Saving Notes:** When a note is saved:
    *   A new symmetric AES-GCM key is generated.
    *   The note content (Markdown) is encrypted with this AES key.
    *   The encrypted content is uploaded to IPFS, yielding a data CID.
    *   The AES key is encrypted using the user's public RSA key.
    *   The user's manifest file is fetched from IPFS (using the CID stored in localStorage).
    *   A new entry is added/updated in the manifest's `files` object, containing the data CID, the encrypted AES key (base64), the IV (base64), and other metadata (filename, type, timestamps).
    *   The *updated* manifest JSON is uploaded to IPFS, yielding a *new* manifest CID.
    *   The new manifest CID replaces the old one in localStorage.
4.  **Loading Notes:** When a note is selected:
    *   The current manifest is fetched from IPFS.
    *   The corresponding file entry is found using its path.
    *   The encrypted note content is fetched from IPFS using its data CID.
    *   The user's private RSA key is retrieved from IndexedDB.
    *   The encrypted AES key from the manifest entry is decrypted using the private RSA key.
    *   The encrypted note content is decrypted using the decrypted AES key and the stored IV.
    *   The decrypted Markdown content is displayed or rendered.
5.  **Device Sync:**
    *   **Export:** The current device exports the private key (as JWK) and the latest manifest CID, encodes them into a JSON string, URL-encodes that string, and generates a QR code representing a URL like `https://<app-url>/#sync=<encoded-data>`.
    *   **Import:** The new device scans the QR code, opening the URL. The app detects the `#sync=` fragment on load, decodes the data, imports the private key (deriving the public key), stores the key pair in IndexedDB, stores the manifest CID in localStorage, and then attempts to load the account.

This architecture ensures data is encrypted client-side and only accessible to the user who holds the private key, leveraging IPFS for decentralized, content-addressable storage.
