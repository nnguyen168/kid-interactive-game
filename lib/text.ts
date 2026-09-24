/** French typography: keep "!", "?", ":" and ";" glued to the previous word. */
export function frenchSpaces(text: string): string {
  return text.replace(/ ([!?:;»])/g, " $1").replace(/« /g, "« ");
}
