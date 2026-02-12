
export function normalizeIntent(text: string) {
  const t = text.toLowerCase();

  return {
    colors: [
      ...(t.includes("black") || t.includes("dark") ? ["black"] : []),
      ...(t.includes("grey") || t.includes("gray") ? ["grey"] : []),
      ...(t.includes("blue") || t.includes("navy") ? ["blue"] : []),
      ...(t.includes("beige") || t.includes("skin") || t.includes("tan") || t.includes("khaki") ? ["beige"] : []),
      ...(t.includes("white") || t.includes("cream") ? ["white"] : []),
    ],
    wantsTop:
      t.includes("shirt") ||
      t.includes("tshirt") ||
      t.includes("t-shirt") ||
      t.includes("hoodie") ||
      t.includes("sweatshirt") ||
      t.includes("sweater") ||
      t.includes("top") ||
      t.includes("blazer") ||
      t.includes("jacket"),
    wantsBottom:
      t.includes("pant") ||
      t.includes("pants") ||
      t.includes("trousers") ||
      t.includes("jeans") ||
      t.includes("chinos"),
  };
}
