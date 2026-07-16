export type GiftItem = {
  id: string;
  image: string;
  href: string;
  title: string;
  label: string;
};

export const gifts: GiftItem[] = [
  {
    id: "gift-1",
    image: "/gift/gift1.jpg",
    href: "https://a.co/d/004dxavS",
    title: "Tripod Floor Lamp",
    label: "Lighting",
  },
  {
    id: "gift-2",
    image: "/gift/gift2.jpg",
    href: "https://a.co/d/04t4ehbp",
    title: "Modular Sectional Sofa",
    label: "Living",
  },
  {
    id: "gift-3",
    image: "/gift/gift3.jpg",
    href: "https://a.co/d/07gu770v",
    title: "Ribbed Round Coffee Table",
    label: "Living",
  },
  {
    id: "gift-4",
    image: "/gift/gift4.jpg",
    href: "https://a.co/d/0idykUOn",
    title: "Bouclé Throw Pillows",
    label: "Accent",
  },
];
