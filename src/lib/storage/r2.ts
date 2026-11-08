import "server-only";
import { AwsClient } from "aws4fetch";

function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error("Faltan variables de Cloudflare R2 en el entorno (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL).");
  }
  return { account: R2_ACCOUNT_ID, key: R2_ACCESS_KEY_ID, secret: R2_SECRET_ACCESS_KEY, bucket: R2_BUCKET, publicUrl: R2_PUBLIC_URL.replace(/\/$/, "") };
}

function client() {
  const c = config();
  return { c, aws: new AwsClient({ accessKeyId: c.key, secretAccessKey: c.secret, service: "s3", region: "auto" }) };
}

const objectUrl = (c: ReturnType<typeof config>, key: string) => `https://${c.account}.r2.cloudflarestorage.com/${c.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

export async function uploadObject(key: string, body: Uint8Array, contentType: string) {
  const { c, aws } = client();
  const res = await aws.fetch(objectUrl(c, key), {
    method: "PUT",
    body: body as BodyInit,
    headers: { "Content-Type": contentType, "Content-Length": String(body.byteLength), "Cache-Control": "public, max-age=31536000, immutable" },
  });
  if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return `${c.publicUrl}/${key}`;
}

export async function deleteObject(key: string) {
  const { c, aws } = client();
  const res = await aws.fetch(objectUrl(c, key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${res.status}`);
}
