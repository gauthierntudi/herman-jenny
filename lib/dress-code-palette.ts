export type PantoneSwatch = {
  code: string;
  name: string;
  hex: string;
  role: string;
};

export type DressCodeMoment = {
  id: "civil" | "soirée";
  title: string;
  subtitle: string;
  note: string;
  swatches: PantoneSwatch[];
};

/** Civil ceremony — cream palette */
export const civilCeremonyPalette: PantoneSwatch[] = [
  {
    code: "11-0105 TCX",
    name: "Ivory Whisper",
    hex: "#FAF0E4",
    role: "Light cream",
  },
  {
    code: "12-0804 TCX",
    name: "Vanilla Cream",
    hex: "#F3E6D4",
    role: "Main cream",
  },
  {
    code: "13-1006 TCX",
    name: "Champagne Beige",
    hex: "#E8D5B5",
    role: "Warm cream",
  },
  {
    code: "14-1116 TCX",
    name: "Sand Dollar",
    hex: "#DCC8A8",
    role: "Deep cream",
  },
  {
    code: "16-1320 TCX",
    name: "Café Crème",
    hex: "#C4A484",
    role: "Soft accent",
  },
];

/** Evening party — black & gold palette (5 shades, matching civil) */
export const eveningPalette: PantoneSwatch[] = [
  {
    code: "19-0303 TCX",
    name: "Jet Black",
    hex: "#0A0A0A",
    role: "Deep black",
  },
  {
    code: "19-4008 TCX",
    name: "Night Sky",
    hex: "#1A1A1A",
    role: "Suit black",
  },
  {
    code: "16-0836 TCX",
    name: "Pale Gold",
    hex: "#C9A227",
    role: "Light gold",
  },
  {
    code: "15-0927 TCX",
    name: "Antique Gold",
    hex: "#B8960F",
    role: "Antique gold",
  },
  {
    code: "14-0951 TCX",
    name: "Rich Gold",
    hex: "#D4AF37",
    role: "Jewelry gold",
  },
];

export const dressCodeMoments: DressCodeMoment[] = [
  {
    id: "civil",
    title: "Civil Ceremony",
    subtitle: "Pantone cream",
    note: "Cream and ivory tones only. Please avoid pure white (reserved for the bride).",
    swatches: civilCeremonyPalette,
  },
  {
    id: "soirée",
    title: "Evening Party",
    subtitle: "Pantone black & gold",
    note: "Black and gold for the celebration — chic, contrasted, ready to dance.",
    swatches: eveningPalette,
  },
];
