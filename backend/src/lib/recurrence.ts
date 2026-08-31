import { RecurrenceFrequency } from "@prisma/client";

export function addInterval(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DIARIA":
      next.setDate(next.getDate() + 1);
      break;
    case "SEMANAL":
      next.setDate(next.getDate() + 7);
      break;
    case "MENSAL":
      next.setMonth(next.getMonth() + 1);
      break;
    case "ANUAL":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
