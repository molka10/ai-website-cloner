import { createRemoteJWKSet, jwtVerify } from "jose";

// Google's public keys for Firebase sign-in tokens.
// jose downloads them once and caches them.
const GOOGLE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

/**
 * Checks the "Authorization: Bearer <token>" header.
 * Returns the Firebase user id (uid) if the token is valid, otherwise null.
 */
export async function verifyUser(authHeader: string | null): Promise<string | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("The server is missing its FIREBASE_PROJECT_ID.");

  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, GOOGLE_KEYS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    // "sub" is the user's uid. jwtVerify already checked the signature and expiry.
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null; // expired, fake, or from another project
  }
}