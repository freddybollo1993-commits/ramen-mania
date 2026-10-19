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
    goal: 140,
    time: 200,
    spawn_time: 8,
    patience_mult: 1.84,
    intro: "Producción → Cocina → Emplatar: prepara los insumos, cocina el Shio y emplátalo."
  },
  {
    level: 2,
    name: "Nivel 2: Caldo Shoyu Tradicional",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu"],
    max_orders: 1,
    max_customers: 2,
    goal: 170,
    time: 210,
    spawn_time: 8,
    patience_mult: 1.72,
    intro: "Caldo y salsa se preparan en la sartén: sigue el orden caldo → salsa → proteína."
  },
  {
    level: 3,
    name: "Nivel 3: Sabores Profundos",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 1,
    max_customers: 2,
    goal: 220,
    time: 220,
    spawn_time: 7.5,
    patience_mult: 1.61,
    intro: "Flamea el chasu con el soplete y mantén el miso a punto."
  },
  {
    level: 4,
    name: "Nivel 4: Maestría en Caldos",
    arc: "ramen",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 3,
    goal: 280,
    time: 240,
    spawn_time: 7,
    patience_mult: 1.7,
    intro: "El Tonkotsu pide fuego fuerte, reducción y quitar la espuma."
  },

  // === ARCO 2: EL FUEGO DEL WOK — SALTEADOS (Niveles 5 a 8) ===
  {
    level: 5,
    name: "Nivel 5: ¡Fuego en la Cocina!",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 1,
    max_customers: 3,
    goal: 240,
    time: 250,
    spawn_time: 7,
    patience_mult: 1.49,
    intro: "¡Se abre SALTEADOS! Lava y cuece el arroz, y saltéalo en el wok con el toss."
  },
  {
    level: 6,
    name: "Nivel 6: Pollo Teriyaki y Chaufa",
    arc: "salteado",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu"],
    max_orders: 2,
    max_customers: 3,
    goal: 270,
    time: 260,
    spawn_time: 6.5,
    patience_mult: 1.44,
    intro: "Teriyaki en sartén y un segundo wok: reparte bien el fuego."
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
    patience_mult: 1.38,
    intro: "Dos preparaciones a la vez: yakitori y yakiramen."
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
    patience_mult: 1.38,
    intro: "Examen del arco: toda la carta del wok."
  },

  // === ARCO 3: BARRA FRÍA Y NIKKEI — MAKIS (Niveles 9 a 12) ===
  {
    level: 9,
    name: "Nivel 9: El Arte del Makisu",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu"],
    max_orders: 2,
    max_customers: 3,
    goal: 320,
    time: 280,
    spawn_time: 6,
    patience_mult: 1.36,
    intro: "¡Se abre MAKIS! Cuece el shari con Zu, extiéndelo en la esterilla y enrolla con los gestos."
  },
  {
    level: 10,
    name: "Nivel 10: Frescura Acevichada",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu"],
    max_orders: 2,
    max_customers: 4,
    goal: 360,
    time: 290,
    spawn_time: 5.8,
    patience_mult: 1.32,
    intro: "Pescado: córtalo a 90° de las fibras, en su propia tabla."
  },
  {
    level: 11,
    name: "Nivel 11: Conchas y Selva Nikkei",
    arc: "makis",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 4,
    goal: 400,
    time: 300,
    spawn_time: 5.5,
    patience_mult: 1.29,
    intro: "Cobertura, flameado y apretar antes de cortar."
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
    patience_mult: 1.26,
    intro: "Hasta tres makis esperando en la tabla. Examen del arco."
  },

  // === ARCO 4: EL ACEITE DORADO — FRITURAS (Niveles 13 a 16) ===
  {
    level: 13,
    name: "Nivel 13: Olla de Frituras",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 2,
    max_customers: 4,
    goal: 360,
    time: 330,
    spawn_time: 5.2,
    patience_mult: 1.26,
    intro: "¡Se abre FRITURAS! Alitas y kaarage al aceite en su punto."
  },
  {
    level: 14,
    name: "Nivel 14: Crujiente de Panko",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan"],
    max_orders: 3,
    max_customers: 4,
    goal: 410,
    time: 330,
    spawn_time: 5.0,
    patience_mult: 1.24,
    intro: "Empaniza con gestos: harina, huevo y panko; luego aceite y cortes."
  },
  {
    level: 15,
    name: "Nivel 15: Gyozas y Langostinos Furai",
    arc: "frituras",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi"],
    max_orders: 3,
    max_customers: 4,
    goal: 440,
    time: 330,
    spawn_time: 4.8,
    patience_mult: 1.21,
    intro: "Gyozas con pinza de dos dedos y langostino empanizado."
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
    patience_mult: 1.21,
    intro: "Katsu Kare: calienta el kare en sartén y viértelo sobre el bife. Examen del arco."
  },

  // === ARCO 5: RESTAURANTE INSIGNIA Y MAESTRÍA (Niveles 17 a 20) ===
  {
    level: 17,
    name: "Nivel 17: Turno de Mediodía en Shibuya",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"],
    max_orders: 3,
    max_customers: 4,
    goal: 480,
    time: 340,
    spawn_time: 4.4,
    patience_mult: 1.17,
    intro: "Comandas de 3 platos por cliente: organiza las cuatro áreas."
  },
  {
    level: 18,
    name: "Nivel 18: Cena de Gala Shimaya",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru"],
    max_orders: 3,
    max_customers: 4,
    goal: 500,
    time: 350,
    spawn_time: 4.2,
    patience_mult: 1.15,
    intro: "Hora punta: más clientes y menos paciencia."
  },
  {
    level: 19,
    name: "Nivel 19: Hora Pico Matsuri",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru", "Vegetariano"],
    max_orders: 3,
    max_customers: 4,
    goal: 540,
    time: 360,
    spawn_time: 4.0,
    patience_mult: 1.13,
    intro: "Clientes exigentes: los platos fríos o mal armados se rechazan."
  },
  {
    level: 20,
    name: "Nivel 20: Gran Maestro de Japón",
    arc: "maestria",
    ramen_names: ["Shio", "Shoyu", "Miso", "Chashu", "Tonkotsu", "Tan tan", "Ebi", "Bajiru", "Vegetariano"],
    max_orders: 3,
    max_customers: 4,
    goal: 570,
    time: 360,
    spawn_time: 3.8,
    patience_mult: 1.09,
    intro: "Examen del Maestro Matsuo: carta completa."
  }
];


// ===== Campaña 2.0: datos que se suman a cada nivel =====
// Un área abre con TODAS sus mecánicas: desde el primer nivel donde aparece tiene Producción, Cocina y Emplatar (rules.stages).
//  areas: pestañas de cocina disponibles · focus: mecánica que el Maestro presenta (lesson = lección del Aula) ·
//  brief: ficha del Maestro (card:true = ventana que se abre sola la primera vez que se juega ese nivel; si no, solo el aviso corto `intro`) · rules: reglas del nivel.
const NIVEL_EXTRA = {
  1: {
    areas: [
      "ramen"
    ],
    focus: {
      area: "ramen",
      mechanic: "Producción → Cocina → Emplatar",
      lesson: "ramen"
    },
    brief: {
      card: true,
      title: "Tu primera barra de ramen",
      lines: [
        "Cada plato pasa por tres pantallas: **Producción** (prepara los insumos), **Cocina** (cuenco, fideos y caldo) y **Emplatar** (arma el plato).",
        "Cambia de pantalla deslizando desde el borde o con las pestañas.",
        "Sirve el Shio con los fideos al dente y los adornos que pida la comanda."
      ]
    }
  },
  2: {
    areas: [
      "ramen"
    ],
    focus: {
      area: "ramen",
      mechanic: "Orden en la sartén",
      lesson: "ramen"
    }
  },
  3: {
    areas: [
      "ramen"
    ],
    focus: {
      area: "ramen",
      mechanic: "Salsas y flameado",
      lesson: "ramen"
    }
  },
  4: {
    areas: [
      "ramen"
    ],
    focus: {
      area: "ramen",
      mechanic: "Fuego y reducción",
      lesson: "ramen"
    }
  },
  5: {
    areas: [
      "ramen",
      "salteados"
    ],
    focus: {
      area: "salteados",
      mechanic: "Wok y toss",
      lesson: "salteados"
    },
    brief: {
      card: true,
      title: "¡Se abre el área de Salteados!",
      lines: [
        "El arroz Gohan se **lava, se cuece y se porciona**; las verduras se preparan en Producción.",
        "En la Cocina saltea en el **wok**: levanta con el toss y retira a tiempo para que no se queme.",
        "Emplata con el arroz abajo y la guarnición encima."
      ]
    }
  },
  6: {
    areas: [
      "ramen",
      "salteados"
    ],
    focus: {
      area: "salteados",
      mechanic: "Sartén de teriyaki y segundo wok",
      lesson: "salteados"
    }
  },
  7: {
    areas: [
      "ramen",
      "salteados"
    ],
    focus: {
      area: "salteados",
      mechanic: "Dos preparaciones a la vez",
      lesson: "salteados"
    }
  },
  8: {
    areas: [
      "ramen",
      "salteados"
    ],
    focus: {
      area: "salteados",
      mechanic: "Examen del arco",
      lesson: "salteados"
    }
  },
  9: {
    areas: [
      "ramen",
      "salteados",
      "makis"
    ],
    focus: {
      area: "makis",
      mechanic: "Shari, esterilla y enrollado",
      lesson: "makis"
    },
    brief: {
      card: true,
      title: "¡Se abre el área de Makis!",
      lines: [
        "El arroz **shari** se lava tres veces, se cuece y se aliña con **Zu**; enfríalo en zigzag.",
        "En la esterilla: arroz, nori y rellenos; enrolla en vista lateral con los **gestos medidos** y aprieta.",
        "Hasta tres makis pueden esperar en la tabla; luego cobertura, flameado y cortes."
      ]
    }
  },
  10: {
    areas: [
      "ramen",
      "salteados",
      "makis"
    ],
    focus: {
      area: "makis",
      mechanic: "Pescado y cortes",
      lesson: "makis"
    }
  },
  11: {
    areas: [
      "ramen",
      "salteados",
      "makis"
    ],
    focus: {
      area: "makis",
      mechanic: "Cobertura y flameado",
      lesson: "makis"
    }
  },
  12: {
    areas: [
      "ramen",
      "salteados",
      "makis"
    ],
    focus: {
      area: "makis",
      mechanic: "Tres makis en la tabla",
      lesson: "makis"
    }
  },
  13: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "frituras",
      mechanic: "Aceite y punto de fritura",
      lesson: "frituras"
    },
    brief: {
      card: true,
      title: "¡Se abre el área de Frituras!",
      lines: [
        "Alitas y kaarage van **directo al aceite**: cuida la temperatura y sácalos en su punto.",
        "Los bifes se **empanizan con gestos** (harina, huevo, panko) y se cortan con tajos.",
        "El emplatado de frituras es dibujado: col, salsa y guarniciones según el plato."
      ]
    }
  },
  14: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "frituras",
      mechanic: "Empanizado por gestos",
      lesson: "frituras"
    }
  },
  15: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "frituras",
      mechanic: "Pinza de dos dedos y langostino",
      lesson: "frituras"
    }
  },
  16: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "frituras",
      mechanic: "Kare en sartén",
      lesson: "frituras"
    }
  },
  17: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "ramen",
      mechanic: "Comandas de tres platos",
      lesson: "ramen"
    },
    brief: {
      card: true,
      title: "Restaurante Insignia",
      lines: [
        "Ahora cada cliente pide **hasta tres platos**, de cualquier área.",
        "Organiza tus cuatro cocinas: adelanta la Producción y usa el pase para no enfriar los platos.",
        "Lo que aprendiste en cada área vale en todos los niveles."
      ]
    }
  },
  18: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "ramen",
      mechanic: "Hora punta",
      lesson: "ramen"
    }
  },
  19: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "ramen",
      mechanic: "Clientes exigentes",
      lesson: "ramen"
    }
  },
  20: {
    areas: [
      "ramen",
      "salteados",
      "makis",
      "frituras"
    ],
    focus: {
      area: "ramen",
      mechanic: "Examen del Maestro",
      lesson: "ramen"
    }
  }
};
NIVELES.forEach(n => Object.assign(n, NIVEL_EXTRA[n.level], { rules: Object.assign({ stages: true }, (NIVEL_EXTRA[n.level] || {}).rules) }));
