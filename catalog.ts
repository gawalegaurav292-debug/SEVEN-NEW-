
import { Product } from "./types";

export const PRODUCT_CATALOG: Product[] = [
  // MEN
  {
    id: "m_t_1", category: "TOP", gender: "men", color: "black", type: "tshirt",
    name: "Black Cotton T-Shirt", brand: "H&M", price: 14.99, currency: "USD",
    description: "Essential minimalist cotton tee.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/d1/6f/d16f9e.jpg],origin[dam]" },
    product_url: "https://www2.hm.com/en_us/productpage.0685816002.html",
    tags: ["black", "tee", "tshirt", "t-shirt"], verified: true, in_stock: true
  },
  {
    id: "m_b_1", category: "BOTTOM", gender: "men", color: "grey", type: "chino",
    name: "Grey Slim Chinos", brand: "Zara", price: 45.90, currency: "USD",
    description: "Tailored chinos for a sharp look.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/91/4e/914e3f.jpg],origin[dam]" },
    product_url: "https://www.zara.com/us/en/tailored-trousers-p00706451.html",
    tags: ["grey", "gray", "pants", "chinos", "trousers"], verified: true, in_stock: true
  },
  {
    id: "m_t_2", category: "TOP", gender: "men", color: "white", type: "shirt",
    name: "White Linen Shirt", brand: "Uniqlo", price: 39.90, currency: "USD",
    description: "Breathable linen shirt for summer.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/d1/6f/d16f9e.jpg],origin[dam]" },
    product_url: "https://www2.hm.com/en_us/productpage.0685816001.html",
    tags: ["white", "shirt", "linen", "button"], verified: true, in_stock: true
  },
  {
    id: "m_b_2", category: "BOTTOM", gender: "men", color: "blue", type: "jeans",
    name: "Blue Denim Jeans", brand: "H&M", price: 39.99, currency: "USD",
    description: "Classic blue denim for everyday wear.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/f3/91/f391aa.jpg],origin[dam]" },
    product_url: "https://www2.hm.com/en_us/productpage.0999373001.html",
    tags: ["blue", "denim", "jeans"], verified: true, in_stock: true
  },
  // WOMEN
  {
    id: "w_t_1", category: "TOP", gender: "women", color: "white", type: "tshirt",
    name: "White Relaxed Tee", brand: "H&M", price: 12.99, currency: "USD",
    description: "Relaxed fit tee for effortless style.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/9c/4f/9c4f1a2e3b7c8d0e6a5b9f4c1d8e2a.jpg],origin[dam]" },
    product_url: "https://www2.hm.com/en_us/productpage.1038923001.html",
    tags: ["white", "tee", "tshirt"], verified: true, in_stock: true
  },
  {
    id: "w_b_1", category: "BOTTOM", gender: "women", color: "black", type: "jeans",
    name: "Black Straight Jeans", brand: "Zara", price: 49.90, currency: "USD",
    description: "Straight leg jeans in deep black.",
    image: { primary: "https://lp2.hm.com/hmgoepprod?set=source[/5a/7b/5a7b3e9c8a1d4f0b2c6e9a7d5f1b8.jpg],origin[dam]" },
    product_url: "https://www2.hm.com/en_us/productpage.1011777001.html",
    tags: ["black", "denim", "jeans"], verified: true, in_stock: true
  }
];

export const VISIBLE_PRODUCTS = PRODUCT_CATALOG;
