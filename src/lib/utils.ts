import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePassword(
  options: { length?: number; includeSymbols?: boolean } = {}
) {
  const { length = 12, includeSymbols = true } = options;

  const prefix = "Bib";
  const totalLength = Math.max(prefix.length + length, 12); // ensure min total length if needed
  const desiredLength = totalLength - prefix.length;

  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?/";

  let allChars = lower + upper + numbers;
  if (includeSymbols) {
    allChars += symbols;
  }

  let password = "";
  for (let i = 0; i < desiredLength; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return prefix + password;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTextFromTipTap(html: any): string {
  if (!html) return "";
  // Create a temporary DOM element to extract text
  const tmp =
    typeof window === "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        new (require("jsdom").JSDOM)(`<div>${html}</div>`).window.document.body
      : document.createElement("div");

  if (typeof window !== "undefined") {
    tmp.innerHTML = html;
    return tmp.textContent || "";
  }

  return tmp.textContent || "";
}

export function extractNumber(input: string): number | null {
  const match = input.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Convierte un número de Gaceta (ej. "37,183", con coma de miles) a un
 * número comparable para poder ordenar de más nueva a más vieja. No sirve
 * usar `extractNumber` acá: esa función solo toma el primer grupo de
 * dígitos ("37" en "37,183"), cortando justo en la coma. Acá quitamos
 * TODOS los caracteres que no sean dígitos antes de convertir, así "37,183"
 * y "37183" dan el mismo número sin importar el formato con el que se haya
 * guardado. Gacetas sin número (null/vacío/no numérico) devuelven -1 para
 * que siempre queden al final en un orden descendente.
 */
export function parseGacetaNumber(value: string | null | undefined): number {
  if (!value) return -1;
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return -1;
  const parsed = parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? -1 : parsed;
}
