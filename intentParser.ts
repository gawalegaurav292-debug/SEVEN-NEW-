
export type ParsedIntent = {
  // Colors
  wantsBlack: boolean;
  wantsGrey: boolean;
  wantsBlue: boolean;
  wantsWhite: boolean;
  wantsBeige: boolean;

  // Tops
  wantsHoodie: boolean;
  wantsShirt: boolean;
  wantsTshirt: boolean;

  // Bottoms
  wantsPants: boolean;
  wantsJeans: boolean;
  wantsChino: boolean;

  // Context
  gender: "men" | "women";
};

export function parseIntent(input: string): ParsedIntent {
  const text = input.toLowerCase();

  return {
    // Colors
    wantsBlack: text.includes("black") || text.includes("dark"),
    wantsGrey: text.includes("grey") || text.includes("gray") || text.includes("silver"),
    wantsBlue: text.includes("blue") || text.includes("navy"),
    wantsWhite: text.includes("white") || text.includes("cream"),
    wantsBeige: text.includes("beige") || text.includes("khaki") || text.includes("tan"),

    // Tops
    wantsHoodie: text.includes("hoodie") || text.includes("sweatshirt") || text.includes("fleece"),
    wantsShirt: (text.includes("shirt") || text.includes("button")) && !text.includes("t-shirt") && !text.includes("tshirt") && !text.includes("tee"),
    wantsTshirt: text.includes("t-shirt") || text.includes("tshirt") || text.includes("tee"),

    // Bottoms
    wantsPants: text.includes("pant") || text.includes("trouser") || text.includes("slack"),
    wantsJeans: text.includes("jean") || text.includes("denim"),
    wantsChino: text.includes("chino"),

    // Gender
    gender: (text.includes("women") || text.includes("female") || text.includes("girl")) ? "women" : "men"
  };
}

export const parseUserText = parseIntent;
