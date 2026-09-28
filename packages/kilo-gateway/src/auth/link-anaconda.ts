/**
 * Link a Kilo account to Anaconda and persist the returned API key
 * in the shared anaconda-cli keyring (~/.anaconda/keyring).
 *
 * Called as a non-fatal side-effect after a successful Kilo device auth login.
 */

import { getApiKey, saveCredential } from "./anaconda-keyring.js"

const ANACONDA_DOMAIN = "anaconda.com"
const LINK_ENDPOINT = `https://${ANACONDA_DOMAIN}/api/auth/kilo/api-key`

interface LinkKeyInfo {
  id: string
  name: string
  user_id: string
  scopes: string[]
  tags: string[]
}

interface LinkResponse {
  api_key: string
  key: LinkKeyInfo
}

/**
 * Call the Anaconda link-kilo endpoint and write the resulting API key
 * to the anaconda keyring.
 *
 * @param kiloToken - The Kilo auth token (used as Bearer credential)
 * @returns true on success, false on failure
 */
export async function linkAnacondaAccount(kiloToken: string): Promise<boolean> {
  const existing = getApiKey(ANACONDA_DOMAIN)
  if (existing) return true

  const response = await fetch(LINK_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kiloToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) return false

  const data = (await response.json()) as LinkResponse

  if (!data.api_key) return false

  saveCredential({
    apiKey: data.api_key,
    domain: ANACONDA_DOMAIN,
    userId: data.key?.user_id,
  })

  return true
}
