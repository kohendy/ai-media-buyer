/** Parse rentang harga dari berbagai format string. */
export function parsePriceRange(priceStr: string): { min: number | null; max: number | null } {
  if (!priceStr || typeof priceStr !== "string") return { min: null, max: null };

  const normalized = priceStr
    .replace(/[Rr][Pp]\.?\s*/g, "") // hapus "Rp" atau "RP"
    .replace(/\s+/g, "") // hapus spasi
    .replace(/,/g, ".") // koma jadi titik untuk desimal
    .replace(/[–—]/g, "-") // dash variants jadi minus
    .toLowerCase();

  // Coba ekstrak angka dengan satuan (ribu/rb/k, juta/jt)
  const numbers: number[] = [];

  // Pattern: angka + optional desimal + optional satuan
  const pattern = /(\d+(?:\.\d+)?)\s*(ribu|rb|k|juta|jt|m)?/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2] || "";
    let multiplier = 1;

    if (["ribu", "rb", "k"].includes(unit)) multiplier = 1_000;
    else if (["juta", "jt", "m"].includes(unit)) multiplier = 1_000_000;

    numbers.push(Math.round(value * multiplier));
  }

  // Fallback: ekstrak semua angka berurutan
  if (numbers.length === 0) {
    const rawNumbers = normalized.match(/\d+/g);
    if (rawNumbers) {
      for (const n of rawNumbers) {
        numbers.push(parseInt(n, 10));
      }
    }
  }

  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };

  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}