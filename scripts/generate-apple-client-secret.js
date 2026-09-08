#!/usr/bin/env node
/**
 * Builds the "Sign in with Apple" client-secret JWT for Supabase's Apple auth
 * provider. See docs/backend-auth-setup.md for where each flag value comes from
 * and where the output goes.
 *
 * Usage:
 *   node scripts/generate-apple-client-secret.js \
 *     --team-id <APPLE_TEAM_ID> --key-id <APPLE_KEY_ID> \
 *     --client-id <APPLE_SERVICES_ID> --key-path <path/to/AuthKey_XXXXXXXXXX.p8>
 */
const crypto = require("node:crypto");
const fs = require("node:fs");

const SIX_MONTHS_SECONDS = 15777000; // Apple's maximum allowed lifetime

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (!key) continue;
    out[key] = argv[i + 1];
  }
  return out;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const teamId = args["team-id"];
  const keyId = args["key-id"];
  const clientId = args["client-id"];
  const keyPath = args["key-path"];

  const missing = ["team-id", "key-id", "client-id", "key-path"].filter((k) => !args[k]);
  if (missing.length) {
    console.error(`Missing required flag(s): ${missing.map((k) => `--${k}`).join(", ")}`);
    console.error("\nSee the usage comment at the top of this script for where each value comes from.");
    process.exit(1);
  }

  if (!fs.existsSync(keyPath)) {
    console.error(`Private key file not found: ${keyPath}`);
    process.exit(1);
  }
  const privateKeyPem = fs.readFileSync(keyPath, "utf8");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + SIX_MONTHS_SECONDS,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  // Apple/JOSE expect the raw (r||s) ES256 signature, not the DER encoding Node
  // produces by default — `dsaEncoding: "ieee-p1363"` gives us the raw form.
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKeyPem,
    dsaEncoding: "ieee-p1363",
  });

  const jwt = `${signingInput}.${base64url(signature)}`;

  console.log(jwt);
  console.error(`\nExpires: ${new Date((now + SIX_MONTHS_SECONDS) * 1000).toISOString()} — regenerate before then.`);
}

main();
