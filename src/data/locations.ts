export type Category =
  | "academic"
  | "hostel"
  | "food"
  | "sports"
  | "admin"
  | "transport"
  | "facility";

export interface Location {
  id: string;
  name: string;
  category: Category;
  x: number;
  y: number;
}

export const LOCATIONS: Location[] = [
  // Academic
  { id: "lhc", name: "lecture hall complex", category: "academic", x: 180, y: 200 },
  { id: "cse", name: "cse department", category: "academic", x: 320, y: 180 },
  { id: "library", name: "central library", category: "academic", x: 460, y: 230 },
  { id: "ece", name: "ece department", category: "academic", x: 580, y: 180 },
  { id: "lab", name: "research labs", category: "academic", x: 240, y: 290 },

  // Admin
  { id: "admin", name: "admin block", category: "admin", x: 480, y: 110 },
  { id: "sbi", name: "sbi bank", category: "admin", x: 620, y: 130 },

  // Hostel
  { id: "h1", name: "boys hostel a", category: "hostel", x: 110, y: 460 },
  { id: "h2", name: "boys hostel b", category: "hostel", x: 110, y: 560 },
  { id: "h3", name: "sr bhavan", category: "hostel", x: 260, y: 510 },
  { id: "h4", name: "girls hostel", category: "hostel", x: 720, y: 470 },
  { id: "h5", name: "girls hostel block 2", category: "hostel", x: 720, y: 580 },

  // Food
  { id: "mess", name: "main mess hall", category: "food", x: 360, y: 400 },
  { id: "cafe", name: "campus cafe", category: "food", x: 500, y: 460 },
  { id: "nescafe", name: "nescafe corner", category: "food", x: 540, y: 380 },

  // Sports
  { id: "gym", name: "fitness gym", category: "sports", x: 740, y: 320 },
  { id: "ground", name: "sports ground", category: "sports", x: 800, y: 430 },

  // Transport
  { id: "gate", name: "main gate", category: "transport", x: 500, y: 660 },
  { id: "busstop", name: "bus stop", category: "transport", x: 320, y: 630 },
  { id: "parking", name: "parking lot", category: "transport", x: 680, y: 640 },

  // Facility
  { id: "med", name: "medical center", category: "facility", x: 640, y: 280 },
];

export const CATEGORY_STYLE: Record<
  Category,
  { fill: string; stroke: string; w: number; h: number; label: string }
> = {
  academic: { fill: "#1e3a5f", stroke: "#3b82f6", w: 80, h: 36, label: "Academic" },
  hostel: { fill: "#3d2b00", stroke: "#f59e0b", w: 70, h: 30, label: "Hostel" },
  food: { fill: "#063d2a", stroke: "#10b981", w: 66, h: 28, label: "Food" },
  sports: { fill: "#2e1f5e", stroke: "#8b5cf6", w: 72, h: 30, label: "Sports" },
  admin: { fill: "#1f2937", stroke: "#6b7280", w: 68, h: 28, label: "Admin" },
  transport: { fill: "#431407", stroke: "#f97316", w: 64, h: 26, label: "Transport" },
  facility: { fill: "#4a0d2e", stroke: "#ec4899", w: 70, h: 28, label: "Facility" },
};

export const ZONES = [
  { x: 100, y: 120, w: 520, h: 220, fill: "#1e3a5f", stroke: "#3b82f6", label: "Academic Area" },
  { x: 60, y: 400, w: 280, h: 220, fill: "#3d2b00", stroke: "#f59e0b", label: "Boys Hostels" },
  { x: 650, y: 400, w: 180, h: 220, fill: "#3d2b00", stroke: "#f59e0b", label: "Girls Hostels" },
  { x: 220, y: 340, w: 380, h: 180, fill: "#063d2a", stroke: "#10b981", label: "Dining Area" },
  { x: 680, y: 260, w: 200, h: 240, fill: "#2e1f5e", stroke: "#8b5cf6", label: "Sports Complex" },
  { x: 420, y: 60, w: 300, h: 120, fill: "#1f2937", stroke: "#6b7280", label: "Administration" },
  { x: 250, y: 590, w: 500, h: 110, fill: "#431407", stroke: "#f97316", label: "Transport Hub" },
];

export const PATHWAYS = [
  { d: "M500,40 L500,700", w: 8, color: "#334155", label: "Main Road", lx: 510, ly: 360 },
  { d: "M100,200 L650,200", w: 6, color: "#334155", label: "Academic Ave", lx: 360, ly: 195 },
  { d: "M200,400 L800,400", w: 6, color: "#334155", label: "Central Loop", lx: 380, ly: 395 },
  { d: "M200,400 L200,600", w: 5, color: "#2d3748", label: "", lx: 0, ly: 0 },
  { d: "M700,400 L700,600", w: 5, color: "#2d3748", label: "", lx: 0, ly: 0 },
  { d: "M650,200 L800,400", w: 5, color: "#2d3748", label: "", lx: 0, ly: 0 },
  { d: "M480,100 L480,200", w: 4, color: "#2d3748", label: "", lx: 0, ly: 0 },
  { d: "M340,340 L480,460", w: 4, color: "#2d3748", label: "", lx: 0, ly: 0 },
  { d: "M300,620 L700,620", w: 6, color: "#334155", label: "Transport Connector", lx: 420, ly: 615 },
  { d: "M500,620 L500,700", w: 8, color: "#334155", label: "", lx: 0, ly: 0 },
];