/* Módulo 03-datos-niveles-campana — Datos: los 20 niveles de la Campaña.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

// Campaña de 20 niveles dividida en 5 arcos culinarios:
// Arco 1 (L1-4): Fundamentos de Barra de Ramen (solo Ramen)
// Arco 2 (L5-8): El Fuego del Wok (Ramen + Salteados)
// Arco 3 (L9-12): Barra Fría y Nikkei (Ramen + Salteados + Makis)
// Arco 4 (L13-16): El Aceite Dorado (Las 4 áreas: + Frituras)
// Arco 5 (L17-20): Restaurante Insignia y Maestría de Japón (Carta completa)
const NIVELES = [
  // === ARCO 1: FUNDAMENTOS DE LA BARRA DE RAMEN (Niveles 1 a 4) ===
  {
    level: 1,
    name: "Nivel 1: El Primer Caldo",
    arc: "ramen",
    ramen_names: ["Shio"],
    max_orders: 1,
    max_customers: 2,
    goal: 150,
    time: 130,
    spawn_time: 8,
    patience_mult: 1.6,
    intro: "Bienvenido a la barra. Prepara caldos Shio ligeros con precisión. Sirve los fideos al dente."
  },
  {
    level: 2,
    name: "Nivel 2: Caldo Shoyu Tradicional",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu"],
    max_orders: 1,
    max_customers: 2,
    goal: 200,
    time: 140,
    spawn_time: 8,
    patience_mult: 1.5,
    intro: "Incorporamos Salsa Shoyu con bambú y holantao. Cuida el orden de los ingredientes."
  },
  {
    level: 3,
    name: "Nivel 3: Sabores Profundos",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 1,
    max_customers: 2,
    goal: 260,
    time: 150,
    spawn_time: 7.5,
    patience_mult: 1.4,
    intro: "Llega la pasta de Miso fermentada y el Chashu asado. Mantén la concentración en barra."
  },
  {
    level: 4,
    name: "Nivel 4: Maestría en Caldos",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 3,
    goal: 270,
    time: 240,
    spawn_time: 7,
    patience_mult: 1.35,
    intro: "Caldos espesos Tonkotsu y Tan tan picante. Los comensales pueden pedir hasta dos cuencos."
  },

  // === ARCO 2: EL FUEGO DEL WOK — SALTEADOS (Niveles 5 a 8) ===
  {
    level: 5,
    name: "Nivel 5: ¡Fuego en la Cocina!",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 1,
    max_customers: 3,
    goal: 280,
    time: 250,
    spawn_time: 7,
    patience_mult: 1.3,
    intro: "¡Se abre el área de SALTEADOS! Maneja el fuego del wok y prepara arroz Yakimeshi sin quemarlo."
  },
  {
    level: 6,
    name: "Nivel 6: Pollo Teriyaki y Chaufa",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 2,
    max_customers: 3,
    goal: 290,
    time: 260,
    spawn_time: 6.5,
    patience_mult: 1.25,
    intro: "Chicken Teriyaki con tare dulce y Chaufa Shimaya. Alterna con agilidad entre cuencos y sartenes."
  },
  {
    level: 7,
    name: "Nivel 7: Fideos al Wok",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu"],
    max_orders: 2,
    max_customers: 3,
    goal: 300,
    time: 260,
    spawn_time: 6.5,
    patience_mult: 1.2,
    intro: "Brochetas Yakitori y fideos Yakiramen salteados con vegetales frescos. ¡El ritmo sube!"
  },
  {
    level: 8,
    name: "Nivel 8: Sinfonía Caliente",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 3,
    goal: 340,
    time: 270,
    spawn_time: 6,
    patience_mult: 1.2,
    intro: "Toda la carta de wok activa: Yasaitame crujiente, Batayaki Ramen, Karameshi y Omuraisu."
  },

  // === ARCO 3: BARRA FRÍA Y NIKKEI — MAKIS (Niveles 9 a 12) ===
  {
    level: 9,
    name: "Nivel 9: El Arte del Makisu",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu"],
    max_orders: 2,
    max_customers: 3,
    goal: 360,
    time: 280,
    spawn_time: 6,
    patience_mult: 1.18,
    intro: "¡Se abre el área de MAKIS! Coloca el nori, distribuye el arroz shari y enrolla con la esterilla."
  },
  {
    level: 10,
    name: "Nivel 10: Frescura Acevichada",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu"],
    max_orders: 2,
    max_customers: 4,
    goal: 380,
    time: 290,
    spawn_time: 5.8,
    patience_mult: 1.15,
    intro: "Makis con salsa guacamole y el aclamado Maki Acevichado coronado con atún fresco."
  },
  {
    level: 11,
    name: "Nivel 11: Conchas y Selva Nikkei",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 4,
    goal: 420,
    time: 300,
    spawn_time: 5.5,
    patience_mult: 1.12,
    intro: "Conchas de abanico en Maki Hotate y cecina regional en Maki Amazon. Precisión en los cortes."
  },
  {
    level: 12,
    name: "Nivel 12: Makis Flameados al Soplete",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 4,
    goal: 430,
    time: 300,
    spawn_time: 5.2,
    patience_mult: 1.1,
    intro: "Rolls de autor flameados: Yama, ajo tostado Nin Niku y Digion. ¡3 áreas coordinadas!"
  },

  // === ARCO 4: EL ACEITE DORADO — FRITURAS (Niveles 13 a 16) ===
  {
    level: 13,
    name: "Nivel 13: Olla de Frituras",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 4,
    goal: 440,
    time: 330,
    spawn_time: 5.2,
    patience_mult: 1.1,
    intro: "¡Se abre el área de FRITURAS! Controla la temperatura del aceite: Alitas y Kaarage crujiente."
  },
  {
    level: 14,
    name: "Nivel 14: Crujiente de Panko",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 3,
    max_customers: 4,
    goal: 450,
    time: 330,
    spawn_time: 5.0,
    patience_mult: 1.08,
    intro: "Bifes empanizados con panko japonés y cortados en tiras perfectas con salsa katsu."
  },
  {
    level: 15,
    name: "Nivel 15: Gyozas y Langostinos Furai",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi"],
    max_orders: 3,
    max_customers: 4,
    goal: 460,
    time: 330,
    spawn_time: 4.8,
    patience_mult: 1.05,
    intro: "Empanadillas Age Gyozas doradas y crujientes langostinos Ebi Furai sobre ensalada fresca."
  },
  {
    level: 16,
    name: "Nivel 16: Katsu Kare Legendario",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"],
    max_orders: 3,
    max_customers: 4,
    goal: 490,
    time: 340,
    spawn_time: 4.6,
    patience_mult: 1.05,
    intro: "El contundente Katsu Kare con curry aromático. Las 4 estaciones funcionan al unísono."
  },

  // === ARCO 5: RESTAURANTE INSIGNIA Y MAESTRÍA (Niveles 17 a 20) ===
  {
    level: 17,
    name: "Nivel 17: Turno de Mediodía en Shibuya",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"],
    max_orders: 3,
    max_customers: 4,
    goal: 510,
    time: 340,
    spawn_time: 4.4,
    patience_mult: 1.02,
    intro: "Almuerzo de alta velocidad. Comandas combinadas de 3 platos por cliente. ¡Ni un segundo que perder!"
  },
  {
    level: 18,
    name: "Nivel 18: Cena de Gala Shimaya",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"],
    max_orders: 3,
    max_customers: 4,
    goal: 530,
    time: 350,
    spawn_time: 4.2,
    patience_mult: 1.0,
    intro: "Comensales gourmet y críticos de comida. Emplata con máxima calidad para ganar jugosas propinas."
  },
  {
    level: 19,
    name: "Nivel 19: Hora Pico Matsuri",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru", "Vegetariano"],
    max_orders: 3,
    max_customers: 4,
    goal: 560,
    time: 360,
    spawn_time: 4.0,
    patience_mult: 0.98,
    intro: "Festival en el callejón: cola interminable en la puerta. Coordinación absoluta de las 4 estaciones."
  },
  {
    level: 20,
    name: "Nivel 20: Gran Maestro de Japón",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru", "Vegetariano"],
    max_orders: 3,
    max_customers: 4,
    goal: 580,
    time: 360,
    spawn_time: 3.8,
    patience_mult: 0.95,
    intro: "El examen final ante el Maestro Matsuo. ¡Demuestra que eres el Chef Supremo de Shimaya!"
  }
];
