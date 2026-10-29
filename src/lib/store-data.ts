export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  originalPriceInCents?: number;
  imageUrl: string;
  badge?: string;
  prepMinutes: number;
  featured: boolean;
};

export const categories: Category[] = [
  { id: 1, name: "Marmitas", slug: "marmitas", description: "Executivas completas e bem servidas", sortOrder: 1 },
  { id: 2, name: "Pratos família", slug: "familia", description: "Para compartilhar sem economizar no sabor", sortOrder: 2 },
  { id: 3, name: "Petiscaria", slug: "petiscaria", description: "Terça a sábado, no período noturno", sortOrder: 3 },
  { id: 4, name: "Bebidas", slug: "bebidas", description: "Geladas para acompanhar", sortOrder: 4 },
];

export const products: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Frango à milanesa",
    slug: "frango-milanesa",
    description: "Frango crocante, arroz soltinho, feijão caseiro, fritas e salada fresca.",
    priceInCents: 2797,
    imageUrl: "https://images.pexels.com/photos/34520967/pexels-photo-34520967.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Mais pedido",
    prepMinutes: 25,
    featured: true,
  },
  {
    id: 2,
    categoryId: 1,
    name: "Estrogonofe de frango",
    slug: "estrogonofe-frango",
    description: "Molho cremoso da casa, arroz branco e batata palha bem crocante.",
    priceInCents: 2797,
    imageUrl: "https://images.pexels.com/photos/11256675/pexels-photo-11256675.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Queridinho",
    prepMinutes: 20,
    featured: true,
  },
  {
    id: 3,
    categoryId: 1,
    name: "Filé à parmegiana",
    slug: "file-parmegiana",
    description: "Filé empanado, molho artesanal, queijo gratinado, arroz e fritas.",
    priceInCents: 3990,
    imageUrl: "https://images.pexels.com/photos/11094169/pexels-photo-11094169.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Especial",
    prepMinutes: 30,
    featured: true,
  },
  {
    id: 4,
    categoryId: 1,
    name: "Feijoada completa",
    slug: "feijoada-completa",
    description: "Feijão preto, carnes selecionadas, arroz, farofa, couve e laranja. Só às quartas.",
    priceInCents: 3190,
    imageUrl: "https://images.pexels.com/photos/15362105/pexels-photo-15362105.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Hoje",
    prepMinutes: 20,
    featured: true,
  },
  {
    id: 5,
    categoryId: 1,
    name: "Prato caseiro do dia",
    slug: "prato-caseiro-dia",
    description: "Arroz, feijão, proteína do dia, dois acompanhamentos e salada.",
    priceInCents: 2990,
    imageUrl: "https://images.pexels.com/photos/38788365/pexels-photo-38788365.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Feito na hora",
    prepMinutes: 18,
    featured: false,
  },
  {
    id: 6,
    categoryId: 2,
    name: "Frango à parmegiana — família",
    slug: "frango-parmegiana-familia",
    description: "Serve de 3 a 4 pessoas. Acompanha arroz, fritas e salada da casa.",
    priceInCents: 7192,
    imageUrl: "https://images.pexels.com/photos/18303026/pexels-photo-18303026.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Serve até 4",
    prepMinutes: 40,
    featured: true,
  },
  {
    id: 7,
    categoryId: 2,
    name: "Filé à parmegiana — família",
    slug: "file-parmegiana-familia",
    description: "Filé bovino, muito queijo, molho da casa, arroz, fritas e salada.",
    priceInCents: 9980,
    imageUrl: "https://images.pexels.com/photos/31617236/pexels-photo-31617236.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    prepMinutes: 45,
    featured: false,
  },
  {
    id: 8,
    categoryId: 3,
    name: "Espetos na brasa",
    slug: "espetos-brasa",
    description: "Quatro espetos à escolha, mandioca, vinagrete e farofa temperada.",
    priceInCents: 4490,
    imageUrl: "https://images.pexels.com/photos/5643426/pexels-photo-5643426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "A partir das 18h",
    prepMinutes: 28,
    featured: true,
  },
  {
    id: 9,
    categoryId: 3,
    name: "Porção Rango",
    slug: "porcao-rango",
    description: "Carne acebolada, calabresa, fritas, mandioca e molhos da casa.",
    priceInCents: 5490,
    imageUrl: "https://images.pexels.com/photos/5643427/pexels-photo-5643427.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    badge: "Para dividir",
    prepMinutes: 30,
    featured: false,
  },
  {
    id: 10,
    categoryId: 4,
    name: "Suco de laranja 500ml",
    slug: "suco-laranja-500",
    description: "Natural, gelado e feito na hora.",
    priceInCents: 1190,
    imageUrl: "https://images.pexels.com/photos/18071816/pexels-photo-18071816.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    prepMinutes: 5,
    featured: false,
  },
  {
    id: 11,
    categoryId: 4,
    name: "Refrigerante lata",
    slug: "refrigerante-lata",
    description: "Coca-Cola, Guaraná ou Fanta, 350ml.",
    priceInCents: 690,
    imageUrl: "https://images.pexels.com/photos/17527769/pexels-photo-17527769.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=720&w=1200",
    prepMinutes: 2,
    featured: false,
  },
];

export const dailyProductIds = [4, 1, 5, 2];

export const plans = [
  { name: "Essencial", meals: 10, discount: 10, priceInCents: 26900, description: "Para quem almoça com a gente algumas vezes na semana." },
  { name: "Frequente", meals: 15, discount: 12, priceInCents: 38900, description: "A rotina mais prática, com economia todo mês.", featured: true },
  { name: "Todo dia", meals: 22, discount: 15, priceInCents: 53900, description: "Seu almoço de segunda a sexta já resolvido." },
];

export const neighborhoods = [
  { name: "Centro", feeInCents: 0, eta: "25–35 min" },
  { name: "Jardim Paulista", feeInCents: 350, eta: "30–40 min" },
  { name: "Vila Beatriz", feeInCents: 450, eta: "30–45 min" },
  { name: "Outros bairros", feeInCents: 650, eta: "35–50 min" },
];

export const heroImage = "https://images.pexels.com/photos/17710506/pexels-photo-17710506.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1600";

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueInCents / 100);
}
