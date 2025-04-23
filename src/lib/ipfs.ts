// src/lib/ipfs.ts
import * as uint8arrays from 'uint8arrays';

const PINATA_API_BASE = 'https://api.pinata.cloud';

// Function to construct the gateway URL from environment variable or default
function getIpfsGatewayUrl(): string {
  const customGateway = import.meta.env.VITE_PINATA_GATEWAY;
  if (customGateway) {
    // Ensure it starts with https:// and ends with /ipfs/
    const prefix = customGateway.startsWith('https://') ? '' : 'https://';
    const suffix = customGateway.endsWith('/ipfs/') ? '' : '/ipfs/';
    const fullUrl = `${prefix}${customGateway}${suffix}`;
    console.log('Using dedicated Pinata Gateway:', fullUrl);
    return fullUrl;
  } else {
    console.warn('VITE_PINATA_GATEWAY not set, using public gateway.');
    return 'https://gateway.pinata.cloud/ipfs/'; // Default public gateway
  }
}

const IPFS_GATEWAY_URL = getIpfsGatewayUrl(); // Get the URL once

// Function to get the Pinata JWT from environment variables
function getPinataJWT(): string | null {
  // Vite uses import.meta.env for environment variables
  const jwt = import.meta.env.VITE_PINATA_JWT;
  if (!jwt) {
    console.warn('Pinata JWT (VITE_PINATA_JWT) not found in environment variables.');
    return null;
  }
  return jwt;
}

/**
 * Pins arbitrary data (Uint8Array) to Pinata/IPFS.
 * @param data The Uint8Array data to pin.
 * @param pinataMetadata Optional metadata for the pin.
 * @returns The IPFS CID (v0 or v1 string) of the pinned data, or null on failure.
 */
export async function pinDataToIpfs(data: Uint8Array, pinataMetadata?: { name?: string, keyvalues?: Record<string, string> }): Promise<string | null> {
  const jwt = getPinataJWT();
  if (!jwt) return null;

  console.log('Pinning data to IPFS via Pinata...');
  try {
    // Pinata expects form-data
    const formData = new FormData();
    const blob = new Blob([data]); // Convert Uint8Array to Blob
    formData.append('file', blob); // Pinata API expects the data under the 'file' key

    if (pinataMetadata) {
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }
    // Add pinataOptions if needed (e.g., cidVersion: 1)
    // formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch(`${PINATA_API_BASE}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        // Content-Type is set automatically by fetch for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (!result.IpfsHash) {
        throw new Error('Pinata API response did not include IpfsHash');
    }

    const cid = result.IpfsHash;
    console.log('Data pinned successfully. CID:', cid);
    return cid;
  } catch (error) {
    console.error('Failed to pin data to Pinata:', error);
    return null;
  }
}

/**
 * Pins a JSON object to Pinata/IPFS.
 * @param jsonData The JSON object to pin.
 * @param pinataMetadata Optional metadata for the pin.
 * @returns The IPFS CID (v0 or v1 string) of the pinned JSON, or null on failure.
 */
export async function pinJsonToIpfs(jsonData: object, pinataMetadata?: { name?: string, keyvalues?: Record<string, string> }): Promise<string | null> {
    const jwt = getPinataJWT();
    if (!jwt) return null;

    console.log('Pinning JSON to IPFS via Pinata...');
    try {
        const response = await fetch(`${PINATA_API_BASE}/pinning/pinJSONToIPFS`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pinataContent: jsonData,
                ...(pinataMetadata && { pinataMetadata }), // Conditionally add metadata
                // pinataOptions: { cidVersion: 1 } // Optional: force CIDv1
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinata API error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        if (!result.IpfsHash) {
            throw new Error('Pinata API response did not include IpfsHash');
        }

        const cid = result.IpfsHash;
        console.log('JSON pinned successfully. CID:', cid);
        return cid;

    } catch (error) {
        console.error('Failed to pin JSON to Pinata:', error);
        return null;
    }
}


/**
 * Fetches raw data from IPFS using a public gateway.
 * @param cid The IPFS CID string.
 * @returns A Uint8Array of the data, or null on failure.
 */
export async function fetchFromIpfs(cid: string): Promise<Uint8Array | null> {
  console.log(`Fetching data from IPFS for CID: ${cid} via ${IPFS_GATEWAY_URL}...`); // Log which gateway is used
  try {
    const response = await fetch(`${IPFS_GATEWAY_URL}${cid}`); // Use the configured gateway URL

    if (!response.ok) {
      throw new Error(`IPFS gateway error (${response.status}) at ${IPFS_GATEWAY_URL}${cid}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Data fetched successfully for CID: ${cid}`);
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`Failed to fetch data from IPFS for CID ${cid}:`, error);
    return null;
  }
}

/**
 * Fetches JSON data from IPFS using a public gateway.
 * @param cid The IPFS CID string.
 * @returns The parsed JSON object, or null on failure.
 */
export async function fetchJsonFromIpfs(cid: string): Promise<object | null> {
    const rawData = await fetchFromIpfs(cid);
    if (!rawData) {
        return null;
    }
    try {
        const jsonString = uint8arrays.toString(rawData, 'utf8');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Failed to parse JSON from IPFS CID ${cid}:`, error);
        return null;
    }
}
