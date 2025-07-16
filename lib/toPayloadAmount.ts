// Convert user input (string) to payload amount (string) for blockchain
// Example: input '1.2345', decimals 8 => '123450000'
export function toPayloadAmount(input: string, decimals: number): string {
  if (!input) return "0";
  const [intPart, decPart = ""] = input.split(".");
  // Remove leading zeros from intPart
  const normalizedInt = intPart.replace(/^0+/, "") || "0";
  // Pad decimal part to the right length
  const paddedDec = decPart.padEnd(decimals, "0").slice(0, decimals);
  const result = normalizedInt + paddedDec;
  // Remove leading zeros again for the final result
  return result.replace(/^0+/, "") || "0";
}
