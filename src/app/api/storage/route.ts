import { apiHandler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getEnv, isStorageConfigured } from "@/lib/env";
import { storagePrefixFor } from "@/services/storage/s3";

/** Status penyimpanan objek untuk dashboard (tanpa membocorkan kredensial). */
export async function GET() {
  return apiHandler(async () => {
    await requireUser();
    const env = getEnv();
    return ok({
      configured: isStorageConfigured(),
      bucket: env.S3_BUCKET || null,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || null,
      prefixes: {
        asset: storagePrefixFor("asset"),
        landing_page: storagePrefixFor("landing_page"),
        screenshot: storagePrefixFor("screenshot"),
        document: storagePrefixFor("document"),
        export: storagePrefixFor("export"),
      },
    });
  });
}
