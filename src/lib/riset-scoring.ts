/** Skala skor 1-5 untuk jawaban ordinal. */
export function answerToScore(questionKey: string, answer: string): number {
  const normalized = answer.toLowerCase().trim();

  // Validasi jawaban
  if (!["rendah", "sedang", "tinggi"].includes(normalized)) {
    throw new Error(`Jawaban tidak valid: ${answer}. Harus salah satu dari: rendah, sedang, tinggi`);
  }

  // Skala dasar: rendah=1, sedang=3, tinggi=5
  let score: number;
  switch (normalized) {
    case "rendah":
      score = 1;
      break;
    case "sedang":
      score = 3;
      break;
    case "tinggi":
      score = 5;
      break;
    default:
      score = 3;
  }

  // Khusus competition: dibalik (persaingan ketat = buruk)
  if (questionKey === "competition") {
    score = 6 - score; // 1<->5, 3<->3
  }

  return score;
}

/** Konversi skor numerik 1-5 ke label untuk UI. */
export function scoreToLabel(score: number): string {
  if (score <= 1.5) return "Rendah";
  if (score <= 2.5) return "Rendah-Sedang";
  if (score <= 3.5) return "Sedang";
  if (score <= 4.5) return "Sedang-Tinggi";
  return "Tinggi";
}

/** Hitung rata-rata skor 1-5 dari array skor per pertanyaan. */
export function calculateAverageScore(scores: { questionKey: string; answer: string }[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + answerToScore(s.questionKey, s.answer), 0);
  return Math.round((sum / scores.length) * 100) / 100; // 2 desimal
}