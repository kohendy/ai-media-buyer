import { z } from "zod";
import { db } from "@/db";
import { productBriefs, products } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";

const bodySchema = z.object({
  name: z.string().min(2),
  kind: z.enum(["online_physical", "digital", "offline_service", "other"]).default("online_physical"),
  mode: z.enum(["quick", "full", "free_text"]).default("quick"),
  description: z.string().min(2),
  priceInfo: z.record(z.string(), z.unknown()).default({}),
  specs: z.string().optional(),
  ownerStrengths: z.string().optional(),
  targetBuyer: z.string().optional(),
  problemsSolved: z.string().optional(),
  differentiators: z.string().optional(),
  proof: z.record(z.string(), z.unknown()).default({}),
  claimLimits: z.string().optional(),
  offerGuarantee: z.string().optional(),
  orderChannel: z.string().optional(),
  toneNotes: z.string().optional(),
  rawText: z.string().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  return apiHandler(async () => {
    await requireUser();
    return ok({ items: await db.select().from(products) });
  });
}

/** Buat produk dari brief manual (jalur 1b). */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Brief belum lengkap.", { issues: parsed.error.issues });

    const data = parsed.data;
    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        slug: slugify(data.name),
        kind: data.kind,
        origin: "manual_brief",
        status: "selected",
        selectedAt: new Date(),
        context: data.context,
        createdBy: user.id,
      })
      .returning();

    const [brief] = await db
      .insert(productBriefs)
      .values({
        productId: product.id,
        version: 1,
        mode: data.mode,
        description: data.description,
        priceInfo: data.priceInfo,
        specs: data.specs,
        ownerStrengths: data.ownerStrengths,
        targetBuyer: data.targetBuyer,
        problemsSolved: data.problemsSolved,
        differentiators: data.differentiators,
        proof: data.proof,
        claimLimits: data.claimLimits,
        offerGuarantee: data.offerGuarantee,
        orderChannel: data.orderChannel,
        toneNotes: data.toneNotes,
        rawText: data.rawText,
        status: "submitted",
        createdBy: user.id,
      })
      .returning();

    await recordAudit({
      userId: user.id,
      action: "create",
      entityType: "products",
      entityId: product.id,
      after: { name: product.name, origin: product.origin },
    });

    return ok({ product, brief }, { status: 201 });
  });
}
