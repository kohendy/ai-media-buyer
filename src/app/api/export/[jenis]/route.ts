import { rawSql } from "@/db";
import { apiHandler, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\r\n");
}

/** Ekspor Excel (CSV) untuk laporan, performa per angle, dan performa creative. */
export async function GET(_request: Request, context: { params: Promise<{ jenis: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { jenis } = await context.params;
    if (!["laporan", "performa", "creative"].includes(jenis)) {
      return fail(400, "INVALID_JENIS", "Jenis ekspor harus laporan, performa, atau creative.");
    }

    const rows =
      jenis === "performa"
        ? await rawSql`select * from v_angle_performance`
        : jenis === "creative"
          ? await rawSql`select * from v_creative_fatigue`
          : await rawSql`select * from v_ad_performance`;

    return new Response(toCsv(rows as Array<Record<string, unknown>>), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${jenis}.csv"`,
      },
    });
  });
}
