// utils to get issuer score by wallet
export async function getIssuerScore(
  primaryWallet: string
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://crion.onrender.com/api/v1/issuer/score/${primaryWallet}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.totalScore ?? null;
  } catch {
    return null;
  }
}
