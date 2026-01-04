import shortsCollection from "@/assets/products/shorts-collection.jpeg";
import whiteATee from "@/assets/products/white-a-tee.jpeg";
import abstractBlackTee from "@/assets/products/abstract-black-tee.jpeg";
import keepMovingTee from "@/assets/products/keep-moving-tee.jpeg";
import portraitTee from "@/assets/products/portrait-tee.jpeg";
import dancerTee from "@/assets/products/dancer-tee.jpeg";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "t-shirts" | "shorts" | "hoodies" | "accessories";
  colors: string[];
  sizes: string[];
  description: string;
  featured?: boolean;
  new?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Abstract Figure Tee",
    price: 599,
    image: abstractBlackTee,
    category: "t-shirts",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Premium heavyweight cotton tee featuring an abstract wireframe figure print. The 'Apparel' branding is prominently displayed on the front. Perfect for those who appreciate artistic streetwear.",
    featured: true,
    new: true,
  },
  {
    id: "2",
    name: "Keep It Moving Tee",
    price: 549,
    image: keepMovingTee,
    category: "t-shirts",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Statement back-print tee with bold 'APPAREL - KEEP IT MOVING' typography. Made from 100% premium cotton for ultimate comfort and durability.",
    featured: true,
  },
  {
    id: "3",
    name: "Portrait Art Tee",
    price: 649,
    image: portraitTee,
    category: "t-shirts",
    colors: ["White"],
    sizes: ["S", "M", "L", "XL"],
    description: "Limited edition art collaboration tee featuring a stunning portrait print. This piece bridges fashion and fine art, making a powerful statement.",
    featured: true,
    new: true,
  },
  {
    id: "4",
    name: "Varsity A Tee",
    price: 499,
    image: whiteATee,
    category: "t-shirts",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Classic white tee with bold varsity 'A' patch. A timeless piece that combines collegiate style with modern streetwear aesthetics.",
  },
  {
    id: "5",
    name: "Dancer Silhouette Tee",
    price: 579,
    image: dancerTee,
    category: "t-shirts",
    colors: ["White"],
    sizes: ["S", "M", "L", "XL"],
    description: "Elegant sketch-style dancer print on premium white cotton. The fluid lines capture movement and grace, embodying the artistic spirit of APPAREL Co.",
    new: true,
  },
  {
    id: "6",
    name: "Essential Shorts",
    price: 699,
    originalPrice: 849,
    image: shortsCollection,
    category: "shorts",
    colors: ["Mint", "Brown", "Pink", "Cream"],
    sizes: ["S", "M", "L", "XL"],
    description: "Comfortable everyday shorts with subtle 'Apparel' embroidery. Available in a range of fresh colorways. Made from premium cotton blend for the perfect fit.",
    featured: true,
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  if (category === "all") return products;
  return products.filter((product) => product.category === category);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((product) => product.featured);
};

export const formatPrice = (price: number): string => {
  return `R ${price.toLocaleString()}`;
};
