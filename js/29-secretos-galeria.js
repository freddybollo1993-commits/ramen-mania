/* Módulo 29-secretos-galeria — Secretos del Chef: galería y datos.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

/* ==========================================================================
   COLECCIÓN COMPLETA DE SECRETOS DEL CHEF - 3D INTERACTIVO & RESEÑAS
   ========================================================================== */

const CHEF_SECRETS = [
  // --- TAZONES DE RAMEN (9) ---
  {
    id: "ramen_shio",
    category: "ramen",
    name: "Shio Ramen",
    kanji: "塩ラーメン",
    subtitle: "Ramen Cristalino Tradicional de Hakodate",
    icon: "🍜",
    lore: "El Shio Ramen es la manifestación más pura y exigente de la cocina de fideos japonesa. Su caldo cristalino se elabora a fuego muy lento con sal marina de Okinawa (Moshio), huesos de pollo de granja, alga kombu y verduras frescas. Al no llevar salsas oscuras, la calidad y frescura de cada ingrediente queda totalmente expuesta al paladar.",
    tareTitle: "🧂 Componentes del Caldo & Tare",
    tare: [
      { icon: "🌊", name: "Sal Marina Moshio", desc: "Sal de algas secadas al sol con notas yodadas minerales." },
      { icon: "🍗", name: "Chintan de Ave", desc: "Caldo de pollo cristalino cocinado a fuego bajo sin hervir." },
      { icon: "🥓", name: "Chashu Tierno", desc: "Loncha magra braseada que aporta sutil grasa al caldo claro." },
      { icon: "🌱", name: "Moyashi & Nori", desc: "Brotes crujientes y alga marina para balancear texturas." }
    ],
    stats: [
      { label: "Cuerpo Caldo:", val: "Ligero / Cristalino" },
      { label: "Intensidad Sal:", val: "★★★★☆" },
      { label: "Punto Fideos:", val: "Finos Ondulados" },
      { label: "Maridaje:", val: "Té Verde Hojicha" }
    ],
    buffs: [
      "💰 +20% de Propina en pedidos de Shio Ramen",
      "⏳ +3 Segundos de paciencia en clientes tradicionales",
      "✨ Bono de +120 Puntos de Prestigio Culinario"
    ]
  },
  {
    id: "ramen_shoyu",
    category: "ramen",
    name: "Shoyu Ramen",
    kanji: "醤油ラーメン",
    subtitle: "El Clásico Legendario de Tokyo (Asakusa 1910)",
    icon: "🍜",
    lore: "Surgido en el histórico barrio de Asakusa en 1910, el Shoyu Ramen es el arquetipo del ramen japonés. Su base es un tare añejo de salsa de soja oscura fermentada en barricas de cedro japonés, infusionada con dashi de bonito seco ahumado (katsuobushi). Los fideos elásticos absorben el color ámbar del caldo.",
    tareTitle: "🥢 Tare Oscuro & Acompañamientos",
    tare: [
      { icon: "🍶", name: "Shoyu Añejado", desc: "Soja artesanal de fermentación doble con umami complejo." },
      { icon: "🐟", name: "Katsuobushi Dashi", desc: "Copos de bonito ahumado para un fondo aromático." },
      { icon: "🎋", name: "Menma Fermentado", desc: "Brotes tiernos de bambú marinados en salsa agridulce." },
      { icon: "🥬", name: "Holantao Crujiente", desc: "Vainas tiernas de guisante dulce para contraste fresco." }
    ],
    stats: [
      { label: "Color Caldo:", val: "Ámbar Brillante" },
      { label: "Complejidad:", val: "★★★★★" },
      { label: "Grosor Fideos:", val: "Medio Elástico" },
      { label: "Región:", val: "Tokyo / Kanto" }
    ],
    buffs: [
      "💰 +22% de Propina en pedidos Shoyu",
      "⏱️ Disminuye el tiempo de cocción de fideos un 15%",
      "🔥 Multiplicador de Combo +10%"
    ]
  },
  {
    id: "ramen_miso",
    category: "ramen",
    name: "Miso Ramen",
    kanji: "味噌ラーメン",
    subtitle: "La Fuerza Cálida del Norte (Sapporo, Hokkaido)",
    icon: "🍜",
    lore: "Creado en los gélidos inviernos de Hokkaido en 1965. Los fideos gruesos y rizados se sumergen en una sopa robusta enriquecida con pasta de soja miso fermentada, salteada en wok al fuego vivo con manteca y ajo picado para sellar una película de calor que mantiene el tazón hirviendo hasta el último sorbo.",
    tareTitle: "🍲 Pasta de Miso & Especias",
    tare: [
      { icon: "🥣", name: "Miso Rojo & Blanco", desc: "Mezcla equilibrada de soja fermentada dulce y salina." },
      { icon: "🧄", name: "Ajo Tostado en Wok", desc: "Aroma tostado intenso que despierta el apetito al instante." },
      { icon: "🧈", name: "Manteca Aromática", desc: "Sella el calor y aporta untuosidad densa y aterciopelada." },
      { icon: "🎋", name: "Bambú & Holantao", desc: "Verduras salteadas que equilibran la potencia del miso." }
    ],
    stats: [
      { label: "Densidad Caldo:", val: "Cremoso / Robusto" },
      { label: "Potencia Sabor:", val: "★★★★★" },
      { label: "Fideos:", val: "Gruesos Rizados" },
      { label: "Origen:", val: "Sapporo (Hokkaido)" }
    ],
    buffs: [
      "💰 +25% de Propina en pedidos Miso",
      "❄️ Clientes impacientes tardan 4s más en enojarse",
      "🏆 +180 Puntos por orden perfecta"
    ]
  },
  {
    id: "ramen_tonkotsu",
    category: "ramen",
    name: "Tonkotsu Ramen",
    kanji: "豚骨ラーメン",
    subtitle: "Emulsión de Médula & Colágeno de Hakata",
    icon: "🍜",
    lore: "El rey indiscutible de Kyushu. Los huesos de cerdo fémur (genkotsu) y espinazo se hierven a borbotones salvajes durante más de 18 horas ininterrumpidas. El colágeno y la médula ósea se disuelven en agua pura, creando un caldo blanco lechoso de textura aterciopelada y sabor profundo.",
    tareTitle: "🦴 Emulsión de Hueso & Guarnición",
    tare: [
      { icon: "🦴", name: "Genkotsu 18 Horas", desc: "Huesos de cerdo ricos en calcio y gelatina natural." },
      { icon: "🥬", name: "Col Hervida Suave", desc: "Hojas tiernas de col que absorben la grasa del caldo." },
      { icon: "🌱", name: "Moyashi Fresco", desc: "Brotes de soja crujientes que refrescan el paladar." },
      { icon: "🥓", name: "Chashu Glaseado", desc: "Panceta que se deshace al mezclarse con el caldo caliente." }
    ],
    stats: [
      { label: "Color Caldo:", val: "Blanco Lechoso" },
      { label: "Nivel Colágeno:", val: "★★★★★" },
      { label: "Fideos:", val: "Ultrafinos Rectos" },
      { label: "Estilo:", val: "Hakata (Fukuoka)" }
    ],
    buffs: [
      "💰 +30% de Propina en pedidos Tonkotsu",
      "⏳ +5 Segundos de paciencia en comensales VIP",
      "✨ +200 Puntos de maestría culinaria"
    ]
  },
  {
    id: "ramen_chashu",
    category: "ramen",
    name: "Chashu Ramen",
    kanji: "チャーシュー麺",
    subtitle: "Banquete Carnívoro de Panceta Braseada",
    icon: "🥩",
    lore: "El tazón soñado por los amantes de la carne. La superficie entera del tazón queda cubierta por un abanico generoso de panceta de cerdo braseada durante 4 horas en mirin, soja dulce y sake, coronada con un huevo ajitsuke de yema líquida y alga nori sobre una base de caldo tonkotsu espeso.",
    tareTitle: "🥩 Selección Carnívora Suprema",
    tare: [
      { icon: "🥓", name: "Corona de Chashu", desc: "4 a 5 lonchas gruesas veteadas con corteza acaramelada." },
      { icon: "🥚", name: "Huevo Ajitsuke", desc: "Yema dorada melosa macerada durante 24 horas en frío." },
      { icon: "🍲", name: "Fondo Tonkotsu", desc: "Base rica que potencia la jugosidad de la carne de cerdo." },
      { icon: "🍙", name: "Nori Tostado", desc: "Hoja marina crujiente para envolver cada bocado carnoso." }
    ],
    stats: [
      { label: "Proteína Total:", val: "Suprema / Extra" },
      { label: "Suculencia:", val: "★★★★★" },
      { label: "Satisfacción:", val: "100% Garantizada" },
      { label: "Tiempo Prep:", val: "Cuidado Artesanal" }
    ],
    buffs: [
      "💰 +35% de Propina en pedidos Chashu Ramen",
      "⭐ Otorga 1 corazón de vida extra en modo Rash",
      "🔥 Multiplicador de Combo x1.25"
    ]
  },
  {
    id: "ramen_ebi",
    category: "ramen",
    name: "Ebi Ramen",
    kanji: "海老ラーメン",
    subtitle: "Esencia Marina de Langostino Tostado",
    icon: "🦐",
    lore: "Una oda a la riqueza del océano Pacífico. Las cabezas y caparazones de langostinos dulces se tuestan en horno de piedra con aceite de sésamo antes de reducirse en un bisque ultraconcentrado. El aroma a marisco tostado invade la sala en cuanto se sirve el plato.",
    tareTitle: "🦐 Bisque Marino & Toppings",
    tare: [
      { icon: "🦐", name: "Aceite de Ebi", desc: "Extracción aromática prensada de langostinos tostados." },
      { icon: "🍄", name: "Champiñones", desc: "Láminas salteadas que absorben el jugo del marisco." },
      { icon: "🎋", name: "Espárragos Verdes", desc: "Tallos blanqueados que aportan frescura vegetal." },
      { icon: "🍙", name: "Nori de Ariake", desc: "Potencia el yodo y el aroma a brisa marina." }
    ],
    stats: [
      { label: "Aroma Marino:", val: "Intenso / Embriagador" },
      { label: "Umami Marino:", val: "★★★★★" },
      { label: "Caldo:", val: "Bisque Anaranjado" },
      { label: "Maridaje:", val: "Cerveza Asahi Dry" }
    ],
    buffs: [
      "💰 +28% de Propina en Ebi Ramen",
      "⏱️ +3s de tiempo adicional en rondas contrarreloj",
      "✨ +160 Puntos gastronómicos"
    ]
  },
  {
    id: "ramen_tantan",
    category: "ramen",
    name: "Tan Tan Ramen",
    kanji: "担々麺",
    subtitle: "Fuego Aromático de Sésamo & Rayu",
    icon: "🌶️",
    lore: "Nacido del mítico Dan Dan de Sichuan y reinterpretado por los maestros de Tokyo. Combina un caldo aterciopelado de pasta de sésamo blanco tostado (Zhimajiang) con aceite de chile rojo rayu artesanal y un montículo jugoso de carne de cerdo molida sofrita con especias chinas y soja.",
    tareTitle: "🌶️ Especias Picantes & Sésamo",
    tare: [
      { icon: "🌶️", name: "Aceite Rayu Rojo", desc: "Chile infundido con pimienta de Sichuan y anís estrellado." },
      { icon: "🥣", name: "Pasta Zhimajiang", desc: "Sésamo tostado molido a la piedra con textura sedosa." },
      { icon: "🥩", name: "Soboro de Chancho", desc: "Carne molida crujiente salteada con jengibre y ajo." },
      { icon: "🌱", name: "Moyashi Refrescante", desc: "Brotes acuosos que calman el ardor agradable del picante." }
    ],
    stats: [
      { label: "Nivel Picante:", val: "Medio-Alto (🌶️🌶️🌶️)" },
      { label: "Untuosidad Sésamo:", val: "★★★★★" },
      { label: "Perfil:", val: "Sichuan-Tokyo Fusion" },
      { label: "Final en Boca:", val: "Hormigueo Cítrico" }
    ],
    buffs: [
      "💰 +25% de Propina en Tan Tan",
      "🔥 Activa Fervor de Ventas (+15% velocidad de servicio)",
      "🏆 +190 Puntos de estilo"
    ]
  },
  {
    id: "ramen_vegetariano",
    category: "ramen",
    name: "Ramen Vegetariano",
    kanji: "精進ラーメン",
    subtitle: "Armonía Zen de la Cocina Monacal Budista",
    icon: "🥬",
    lore: "Heredero de la cocina tradicional de los templos budistas (Shojin Ryori). Este tazón demuestra que no se necesita carne para alcanzar la excelencia culinaria. El caldo se extrae mediante cocción lenta de setas shiitake secas, alga kombu marina, jengibre y verduras asadas.",
    tareTitle: "🌱 Selección Botánica Pura",
    tare: [
      { icon: "🍄", name: "Shiitake Donko", desc: "Hongo seco que aporta ácido guanílico y aroma a bosque." },
      { icon: "🧈", name: "Tofu Aburaage", desc: "Triángulos de tofu frito que absorben el caldo como esponjas." },
      { icon: "🎋", name: "Espárragos & Hongos", desc: "Vegetales crujientes salteados en aceite de sésamo virgen." },
      { icon: "🌊", name: "Kombu Hidratado", desc: "El glutamato natural más puro del lecho marino." }
    ],
    stats: [
      { label: "Pureza Caldo:", val: "100% Origen Vegetal" },
      { label: "Ligereza Digestiva:", val: "★★★★★" },
      { label: "Texturas:", val: "Crujiente & Esponjosa" },
      { label: "Filosofía:", val: "Shojin Ryori Zen" }
    ],
    buffs: [
      "💰 +20% de Propina en Vegetariano",
      "🌿 Clientes relajados: la barra se vacía un 20% más rápido",
      "✨ +140 Puntos Zen"
    ]
  },
  {
    id: "ramen_bajiru",
    category: "ramen",
    name: "Bajiru Ramen",
    kanji: "バジルラーメン",
    subtitle: "Vanguardia Italo-Japonesa de Albahaca",
    icon: "🌿",
    lore: "Una creación audaz que causa furor en los barrios más cosmopolitas de Tokyo. Se fusiona un caldo shio emulsionado con un tare verde brillante de hojas frescas de albahaca (bajiru) machacadas en mortero suribachi con aceite de oliva, acompañado de brisket de res finamente laminado y alga wanji.",
    tareTitle: "🌿 Emulsión Verde & Brisket",
    tare: [
      { icon: "🌿", name: "Pesto de Bajiru", desc: "Albahaca japonesa fresca con notas anisadas y cítricas." },
      { icon: "🥩", name: "Brisket Laminado", desc: "Corte de pecho vacuno tierno que complementa la hierba." },
      { icon: "🥕", name: "Zanahoria Juliana", desc: "Finas tiras anaranjadas para un toque crujiente y dulce." },
      { icon: "🌊", name: "Alga Wanji Suave", desc: "Wakame tierno que flota en el caldo verde esmeralda." }
    ],
    stats: [
      { label: "Color Caldo:", val: "Verde Esmeralda" },
      { label: "Innovación:", val: "★★★★★" },
      { label: "Frescura:", val: "Herbal Aromática" },
      { label: "Estilo:", val: "Moderne Tokyo Fusion" }
    ],
    buffs: [
      "💰 +26% de Propina en Bajiru",
      "⭐ Incrementa la satisfacción general de clientes un 15%",
      "🏆 +175 Puntos gastronómicos"
    ]
  },

  // --- INGREDIENTES LEGENDARIOS (8) ---
  {
    id: "tamago",
    category: "ingredientes",
    name: "Huevo Ajitsuke",
    kanji: "味付け玉子",
    subtitle: "Huevo Marinado Semi-Líquido Hanjuku",
    icon: "🥚",
    lore: "El Ajitsuke Tamago es el alma y la prueba de fuego de todo maestro ramen. El secreto artesanal comienza con una rigurosa selección de huevos frescos a temperatura ambiente para evitar microfisuras al contacto con el agua en ebullición.\n\nLa cocción se cronometra con precisión absoluta a 6 minutos y 15 segundos, logrando el estado sagrado 'Hanjuku': clara firme pero tierna y sedosa, y una yema cremosa, dorada y de consistencia casi gelatinosa que se funde delicadamente al tocar el caldo hirviendo.\n\nTras un choque térmico inmediato en baño de agua con hielo, se pelan con delicadeza milimétrica y reposan durante 24 horas inmersos en frío en nuestro tare secreto, tiñéndose de un irresistible color caramelo con notas ahumadas y sésamo tostado.",
    tareTitle: "🧂 Tare Secreto de Marinado (Salmuera Fría)",
    tare: [
      { icon: "🥢", name: "Shoyu Añejo", desc: "Soja fermentada oscura para teñido ámbar y profundidad umami." },
      { icon: "🍶", name: "Hon-Mirin", desc: "Aporte de dulzor aterciopelado y brillo laqueado en la superficie." },
      { icon: "🍶", name: "Sake Culinario", desc: "Suaviza las notas ácidas y realza el perfil aromático." },
      { icon: "🌊", name: "Kombu Dashi", desc: "Infusión de alga kombu para una explosión natural de glutamato." }
    ],
    stats: [
      { label: "Punto de Yema:", val: "Hanjuku (Melosa)" },
      { label: "Nivel de Umami:", val: "★★★★★ (5/5)" },
      { label: "Tiempo de Marinado:", val: "24 Horas en Frío" },
      { label: "Topping Final:", val: "Sésamo Tostado" }
    ],
    buffs: [
      "💰 +25% de Propina en cualquier tazón servido con Huevo",
      "⏳ +4 Segundos de Paciencia extra en comensales VIP",
      "🔥 Multiplicador de Combo +10% en modos Carrera y Arcade"
    ]
  },
  {
    id: "chashu",
    category: "ingredientes",
    name: "Chashu Caramelizado",
    kanji: "チャーシュー",
    subtitle: "Panceta Braseada de Corteza Laqueada",
    icon: "🥓",
    lore: "El chashu es la joya de la corona del topping de ramen. Se elabora con panceta de cerdo fresca enrollada a mano con hilo de cocina para conservar sus jugos. Se dora en sartén de hierro para sellar y luego se brasea a fuego muy lento durante 4 horas en una mezcla de shoyu, sake, mirin, azúcar de caña y jengibre fresco.",
    tareTitle: "🔥 Maceración & Braseado Lento",
    tare: [
      { icon: "🥩", name: "Panceta de Grano", desc: "Capas alternadas perfectas de carne magra y grasa untuosa." },
      { icon: "🍶", name: "Glaseado Shoyu-Mirin", desc: "Reducción dulce y salada que laquea la corteza exterior." },
      { icon: "🧅", name: "Jengibre & Negi", desc: "Aromáticos que eliminan cualquier exceso de bravura cárnica." },
      { icon: "🪵", name: "Cocción Lenta 4 Horas", desc: "Derrite el tejido conectivo hasta poder cortarse con cuchara." }
    ],
    stats: [
      { label: "Textura:", val: "Fundente al Contacto" },
      { label: "Punto Glaseado:", val: "Laqueado Brillante" },
      { label: "Tiempo Cocción:", val: "4 Horas a Fuego Lento" },
      { label: "Umami:", val: "★★★★★" }
    ],
    buffs: [
      "💰 +25% de Propina en bowls con Chashu",
      "⏳ +4s de paciencia en clientes exigentes",
      "🔥 Combo x1.15"
    ]
  },
  {
    id: "fideos",
    category: "ingredientes",
    name: "Fideos Kansui Artesanales",
    kanji: "自家製麺",
    subtitle: "Masa Elástica de Trigo con Agua Alcalina",
    icon: "🥢",
    lore: "El alma del ramen son sus fideos. A diferencia de la pasta italiana o los fideos comunes, el ramen requiere harina con alto contenido proteico y agua alcalina (Kansui). Esta agua mineraliza el almidón, otorgando la característica textura amarilla, elástica, masticable (koshibou) y resistente a la absorción rápida del caldo hirviendo.",
    tareTitle: "🌾 Masa Alcalina & Extrusión",
    tare: [
      { icon: "🌾", name: "Harina de Trigo Fuerte", desc: "Alto gluten para una red elástica que no se rompe al hervir." },
      { icon: "💧", name: "Agua Kansui Pura", desc: "Carbonato de sodio y potasio que aporta elasticidad y color." },
      { icon: "⏳", name: "Maduración 24 Horas", desc: "Reposo en frío que relaja el gluten para el estirado perfecto." },
      { icon: "🥢", name: "Corte a Cuchilla", desc: "Grosor calibrado milimétricamente según el tipo de caldo." }
    ],
    stats: [
      { label: "Textura (Katame):", val: "Firme / Masticable" },
      { label: "Elasticidad:", val: "★★★★★" },
      { label: "Porosidad:", val: "Óptima para Caldo" },
      { label: "Humedad:", val: "32% Calibrada" }
    ],
    buffs: [
      "⚡ Reduce el tiempo de hervido un 20%",
      "💰 +15% de propina en todas las órdenes",
      "🏆 +130 Puntos de maestría"
    ]
  },
  {
    id: "caldo_tonkotsu",
    category: "ingredientes",
    name: "Caldo Tonkotsu Sagrado",
    kanji: "豚骨出汁",
    subtitle: "Emulsión de Médula & Huesos de Fémur",
    icon: "🍲",
    lore: "Hervir huesos no es suficiente: la ciencia del Tonkotsu reside en la ebullición turbulenta continua. El movimiento salvaje del agua a borbotones durante 18 horas rompe mecánicamente las moléculas de grasa y las mezcla con la gelatina disuelta de los huesos fémur (genkotsu), logrando una emulsión blanca que no se separa jamás.",
    tareTitle: "🦴 Caldero de Cocción Continua",
    tare: [
      { icon: "🦴", name: "Huesos Genkotsu", desc: "Fémures de cerdo con médula densa y colágeno concentrado." },
      { icon: "🌊", name: "Agua Filtrada Pura", desc: "Sin cloro para mantener la blancura nívea de la emulsión." },
      { icon: "🔥", name: "Fuego Vivo 18 Horas", desc: "Borbollón incesante que pulveriza y emulsiona la grasa." },
      { icon: "🧅", name: "Aromáticos Finales", desc: "Cebolla y ajo añadidos en la última hora para aroma dulce." }
    ],
    stats: [
      { label: "Viscosidad:", val: "Densa / Untuosa" },
      { label: "Contenido Colágeno:", val: "★★★★★" },
      { label: "Coloración:", val: "Blanco Marfil Níveo" },
      { label: "Extracción:", val: "18 Horas Continuas" }
    ],
    buffs: [
      "💰 +30% de Propina en pedidos Tonkotsu",
      "⏳ Los clientes esperan 4s más con gusto",
      "✨ +200 Puntos de perfección"
    ]
  },
  {
    id: "alga_nori",
    category: "ingredientes",
    name: "Alga Nori de Ariake",
    kanji: "有明産 海苔",
    subtitle: "Lámina Marina Crocante Tostada al Fuego",
    icon: "🍙",
    lore: "El alga Nori de mayor prestigio en Japón procede de las aguas poco profundas del mar de Ariake en Kyushu, donde las grandes mareas mezclan agua dulce de ríos con corrientes marinas ricas en nutrientes. Tostada al fuego de carbón vegetal, ofrece un crujido inconfundible y se derrite al contacto con la lengua.",
    tareTitle: "🌊 Cosecha Marina & Tostado",
    tare: [
      { icon: "🌊", name: "Mar de Ariake", desc: "Mareas ricas en minerales volcánicos que nutren el alga." },
      { icon: "🔥", name: "Tostado al Carbón", desc: "Desprende el aroma marino y fija el color verde negruzco." },
      { icon: "💎", name: "Glutamato Puro", desc: "El condimento natural que complementa cualquier caldo." },
      { icon: "🍙", name: "Corte Geométrico", desc: "Láminas rectangulares rígidas que se mantienen erguidas." }
    ],
    stats: [
      { label: "Crujido (Kari-Kari):", val: "Instantáneo / Seco" },
      { label: "Intensidad Marina:", val: "★★★★☆" },
      { label: "Color:", val: "Negro Verdoso Profundo" },
      { label: "Disolución en Boca:", val: "Suave & Sedosa" }
    ],
    buffs: [
      "💰 +15% de Propina en órdenes con Nori",
      "⚡ Acelera el emplatado de tazones un 15%",
      "🏆 +110 Puntos de estilo"
    ]
  },
  {
    id: "langostinos",
    category: "ingredientes",
    name: "Langostino Ebi Real",
    kanji: "車海老",
    subtitle: "Langostino Escalfado de Cola Escarlata",
    icon: "🦐",
    lore: "Los langostinos Ebi se seleccionan uno a uno por su calibre y tersura. Se ensartan en palillos de bambú para mantenerlos completamente rectos durante el escalfado breve en agua con sal marina y sake, conservando su textura jugosa y elástica. Su cola en abanico rojo vivo corona el tazón con orgullo.",
    tareTitle: "🦐 Preparación & Escalfado",
    tare: [
      { icon: "🦐", name: "Langostinos Frescos", desc: "Carne dulce y firme con rayas naturales naranjas y blancas." },
      { icon: "🍶", name: "Baño de Sake Culinario", desc: "Elimina impurezas y realza el dulzor de la proteína." },
      { icon: "🥢", name: "Ensartado Recto", desc: "Mantiene la elegancia anatómica durante la cocción rápida." },
      { icon: "❄️", name: "Baño de Hielo Rápido", desc: "Sella la textura crujiente y fija el color rojo brillante." }
    ],
    stats: [
      { label: "Textura (Puri-Puri):", val: "Firme / Carnosa" },
      { label: "Dulzor Natural:", val: "★★★★★" },
      { label: "Punto Cocción:", val: "Al Dente (2 Minutos)" },
      { label: "Presentación:", val: "Cola Escarlata Íntegra" }
    ],
    buffs: [
      "💰 +25% de Propina en órdenes con Langostinos",
      "⏳ +3s de paciencia en clientes VIP",
      "✨ +150 Puntos marinos"
    ]
  },
  {
    id: "shitake",
    category: "ingredientes",
    name: "Hongo Shiitake Donko",
    kanji: "どんこ椎茸",
    subtitle: "El Tesoro Forestal de Máximo Umami",
    icon: "🍄",
    lore: "Los hongos Shiitake Donko se cosechan en pleno invierno de los troncos de roble japonés cuando el sombrerillo aún está cerrado y abombado. Deshidratados al sol, multiplican su contenido de ácido guanílico por diez. Al rehidratarse lentamente en agua fría, sueltan un néctar dorado indispensable.",
    tareTitle: "🍄 Cultivo en Roble & Secado",
    tare: [
      { icon: "🪵", name: "Troncos de Roble Kunugi", desc: "Madera noble que alimenta el hongo durante 2 años." },
      { icon: "☀️", name: "Deshidratado Solar", desc: "Los rayos UV multiplican el ácido guanílico y vitamina D." },
      { icon: "❄️", name: "Hidratación Fría 24h", desc: "Extracción paciente sin quemar las enzimas del sabor." },
      { icon: "🔪", name: "Corte Estrella Hanagiri", desc: "Incisión decorativa que facilita la entrada del caldo." }
    ],
    stats: [
      { label: "Umami Forestal:", val: "★★★★★ (Máximo)" },
      { label: "Textura:", val: "Carnosa / Esponjosa" },
      { label: "Guanilato Natural:", val: "10x vs Fresco" },
      { label: "Aroma:", val: "Roble & Tierra Mojada" }
    ],
    buffs: [
      "💰 +20% de Propina en órdenes con Shiitake",
      "⭐ +15% de probabilidad de cliente complacido",
      "🏆 +130 Puntos naturales"
    ]
  },
  {
    id: "tofu",
    category: "ingredientes",
    name: "Triángulos de Tofu Dorado",
    kanji: "揚げ豆腐",
    subtitle: "Aburaage Frito en Doble Temperatura",
    icon: "🧈",
    lore: "El Aburaage requiere maestría en el manejo del aceite. Bloques de tofu fresco de soja no transgénica se cortan en triángulos y se fríen primero a 120°C para expandir el vapor interior creando una estructura celular hueca, y luego a 180°C para dorar una corteza fina, crujiente y absorbente.",
    tareTitle: "🧈 Fritura Doble Escalonada",
    tare: [
      { icon: "🌱", name: "Soja Seleccionada", desc: "Cuajada fresca de soja con alto contenido proteico vegetal." },
      { icon: "🔥", name: "Fritura Baja (120°C)", desc: "Expande la masa interna creando bolsas microscópicas." },
      { icon: "⚡", name: "Fritura Alta (180°C)", desc: "Dora la piel exterior con tono dorado ámbar crujiente." },
      { icon: "💧", name: "Prensado en Caldo", desc: "Absorbe hasta 3 veces su peso en caldo hirviendo." }
    ],
    stats: [
      { label: "Capacidad Absorción:", val: "3x Peso en Caldo" },
      { label: "Corteza:", val: "Crujiente Dorada" },
      { label: "Interior:", val: "Suave & Aterciopelado" },
      { label: "Sabor:", val: "Soja Dulce Tostada" }
    ],
    buffs: [
      "💰 +18% de Propina en órdenes con Tofu",
      "⏳ +3s de paciencia en clientes vegetarianos",
      "✨ +120 Puntos zen"
    ]
  },

  // --- CUCHILLOS DEL MAESTRO (5) ---
  {
    id: "cuchillo_santoku",
    category: "cuchillos",
    name: "Cuchillo Santoku",
    kanji: "三徳包丁",
    subtitle: "El Cuchillo de las Tres Virtudes (Carne, Pescado, Verdura)",
    icon: "🔪",
    lore: "Creado a mediados del siglo XX en Japón como evolución moderna para el cocinero integral. Su nombre 'Santoku' (三徳) significa literalmente 'Tres Virtudes' o 'Tres Usos': cortar carne con precisión, filetear pescado sin dañarlo y picar vegetales finamente. Su punta redondeada sheepfoot y filo plano facilitan cortes verticales continuos.",
    tareTitle: "🔨 Forja & Anatomía de la Hoja",
    tare: [
      { icon: "⚔️", name: "Acero VG-10 Clad", desc: "Núcleo de acero al carbono inoxidable con 60 HRC de dureza." },
      { icon: "🌊", name: "Patrón Damasco 33 Capas", desc: "Capas alternadas que reducen la fricción con los alimentos." },
      { icon: "🪵", name: "Mango Wa Octogonal", desc: "Madera de magnolia japonesa resistente al agua con virola." },
      { icon: "📐", name: "Ángulo de Afilado 15°", desc: "Bisel simétrico agudo para cortes de precisión milimétrica." }
    ],
    stats: [
      { label: "Dureza Rockwell:", val: "60 - 61 HRC" },
      { label: "Versatilidad:", val: "★★★★★ (5/5)" },
      { label: "Longitud Hoja:", val: "170 mm" },
      { label: "Balance:", val: "Neutro en la Virola" }
    ],
    buffs: [
      "⚡ Aumenta la velocidad de picado de toppings un 20%",
      "💰 +15% de propina global en el turno",
      "🏆 +150 Puntos de forja legendaria"
    ]
  },
  {
    id: "cuchillo_gyuto",
    category: "cuchillos",
    name: "Cuchillo Gyuto",
    kanji: "牛刀",
    subtitle: "La Espada del Chef Japonés",
    icon: "🗡️",
    lore: "El Gyuto es la cumbre de la adaptación nipona del cuchillo de chef tradicional. Con una hoja esbelta de 210 a 240 mm y punta aguda, está forjado para realizar cortes largos y continuos en chashu braseado, lonchas de brisket y bloques enteros de carne, utilizando toda la longitud de la hoja de un solo trazo.",
    tareTitle: "🔨 Forja de Alta Precisión",
    tare: [
      { icon: "⚔️", name: "Acero Azul Aogami #2", desc: "Acero al carbono tradicional japonés con tungsteno y cromo." },
      { icon: "✨", name: "Filo Bisturí Honbazuke", desc: "Afilar artesanal a mano sobre tres piedras de agua japonesas." },
      { icon: "🪵", name: "Cabo de Madera de Nogal", desc: "Ergonomía de agarre firme incluso con manos húmedas." },
      { icon: "📐", name: "Perfil Curvo Elíptico", desc: "Permite técnica de balanceo rápido en mesa de corte." }
    ],
    stats: [
      { label: "Dureza Rockwell:", val: "62 - 63 HRC" },
      { label: "Retención de Filo:", val: "★★★★★" },
      { label: "Longitud Hoja:", val: "210 mm" },
      { label: "Uso Maestro:", val: "Corte de Carnes & Brisket" }
    ],
    buffs: [
      "🥩 El Chashu y Brisket se preparan 25% más rápido",
      "💰 +20% de propina en bowls con carne",
      "🔥 Multiplicador Combo x1.15"
    ]
  },
  {
    id: "cuchillo_deba",
    category: "cuchillos",
    name: "Cuchillo Deba",
    kanji: "出刃包丁",
    subtitle: "Poder Pesado para Pescados & Mariscos",
    icon: "🔪",
    lore: "Nacido en la legendaria ciudad de forjadores de Sakai en el periodo Edo. El Deba es un cuchillo robusto, pesado y de lomo grueso con filo unilateral (Kataba). Diseñado específicamente para descabezar y despiezar pescados enteros y partir caparazones duros de langostinos ebi sin mellar la hoja jamás.",
    tareTitle: "🔨 Estructura Robusta & Unilateral",
    tare: [
      { icon: "⚔️", name: "Acero Blanco Shirogami", desc: "Pureza extrema de carbono para un filo agresivo y duradero." },
      { icon: "📐", name: "Filo Asimétrico Kataba", desc: "Bisel solo en el lado derecho para separar carne y espina." },
      { icon: "🛡️", name: "Lomo Grueso de 6 mm", desc: "Masa pesada que utiliza la gravedad para cortar caparazones." },
      { icon: "🪵", name: "Mango D-Shape Rústico", desc: "Diseño en forma de castaña para un torque de corte óptimo." }
    ],
    stats: [
      { label: "Dureza Rockwell:", val: "61 HRC" },
      { label: "Fuerza de Impacto:", val: "★★★★★" },
      { label: "Grosor de Lomo:", val: "6.0 mm (Blindado)" },
      { label: "Especialidad:", val: "Mariscos, Ebi & Pescados" }
    ],
    buffs: [
      "🦐 Los langostinos Ebi se procesan 30% más rápido",
      "💰 +20% de propina en bowls marinos",
      "🏆 +160 Puntos de fuerza"
    ]
  },
  {
    id: "cuchillo_nakiri",
    category: "cuchillos",
    name: "Cuchillo Nakiri",
    kanji: "菜切り包丁",
    subtitle: "Maestro Rectangular de Vegetales",
    icon: "🔪",
    lore: "El Nakiri ('corta verduras') es la herramienta sagrada para todo maestro de toppings vegetales. Su hoja rectangular plana y delgada corta los vegetales hasta la tabla de madera sin dejarlos unidos como un acordeón. Permite realizar cortes juliana ultrafinos de negi (puerro), moyashi y col con una rapidez prodigiosa.",
    tareTitle: "🔨 Hoja Rectangular de Doble Bisel",
    tare: [
      { icon: "⚔️", name: "Acero Inoxidable AUS-10", desc: "Resistente a los ácidos de cebollas y verduras frescas." },
      { icon: "📐", name: "Filo Completamente Recto", desc: "Contacto total plano con la tabla en cada movimiento vertical." },
      { icon: "🌿", name: "Hoja Ultradelgada 1.8mm", desc: "Pasa a través de vegetales densos sin rajarlos ni aplastarlos." },
      { icon: "🪵", name: "Mango Redondo de Abedul", desc: "Ligereza absoluta para jornadas intensas de mise en place." }
    ],
    stats: [
      { label: "Dureza Rockwell:", val: "59 - 60 HRC" },
      { label: "Precisión Verduras:", val: "★★★★★" },
      { label: "Velocidad Picado:", val: "Ultrarrápida" },
      { label: "Geometría:", val: "Rectangular Doble Bisel" }
    ],
    buffs: [
      "🥬 Vegetales (Poro, Cebolla, Col) se reponen un 30% más rápido",
      "💰 +15% de propina en pedidos con vegetales",
      "✨ +140 Puntos de precisión"
    ]
  },
  {
    id: "cuchillo_yanagiba",
    category: "cuchillos",
    name: "Cuchillo Yanagiba",
    kanji: "柳刃包丁",
    subtitle: "Hoja de Sauce para Cortes Finos como Seda",
    icon: "🗡️",
    lore: "La hoja más poética y exigente de la cuchillería japonesa. Su diseño largo y delgado imita una hoja de sauce (Yanagi). Afilado con un único bisel espejado, su misión es deslizarse en un único tirón sin presionar los alimentos, cortando el chashu y el pescado en lonchas traslúcidas con una superficie lisa como el cristal.",
    tareTitle: "🔨 Geometría Honyaki & Hoja de Sauce",
    tare: [
      { icon: "⚔️", name: "Forja Honyaki Tradicional", desc: "Una sola pieza de acero templado diferencialmente con arcilla." },
      { icon: "💎", name: "Pulido Espejo (Migaki)", desc: "Refleja como un espejo reduciendo la adherencia celular." },
      { icon: "📐", name: "Largo de Hoja 270 mm", desc: "Permite rebanar lonchas completas en un solo movimiento hacia ti." },
      { icon: "🪵", name: "Mango de Ébano & Plata", desc: "Empuñadura de madera densa con anillo de plata ceremonial." }
    ],
    stats: [
      { label: "Dureza Rockwell:", val: "63 - 64 HRC" },
      { label: "Finura de Filo:", val: "★★★★★ (Máxima)" },
      { label: "Longitud Hoja:", val: "270 mm" },
      { label: "Acabado:", val: "Espejo Quirúrgico" }
    ],
    buffs: [
      "✨ Desbloquea presentación de lujo: +40% de propina en clientes VIP",
      "⏳ +5s de paciencia global",
      "🏆 +250 Puntos supremos"
    ]
  },

  // --- HERRAMIENTAS DEL MAESTRO (1) ---
  {
    id: "herramienta_benriner",
    category: "herramientas",
    name: "Benriner Turning Slicer",
    kanji: "桂剥き器 ベンリナー",
    subtitle: "El Torno de las Láminas Continuas (Katsuramuki)",
    icon: "⚙️",
    lore: "El katsuramuki (桂剥き) es una de las pruebas de cuchillo más exigentes de la cocina japonesa: pelar un cilindro de daikon, zanahoria o pepino en una sola lámina continua, translúcida y de grosor uniforme, que luego se enrolla y se corta en hilos finísimos para guarniciones. A mano exige años de práctica. El torno Benriner (ベンリナー, de benri 便利, 'práctico') mecaniza ese gesto: la verdura se clava en un disco de púas, una manivela la hace girar contra una hoja de acero ajustable y la lámina sale larga, pareja y sin romperse.\n\nEn las barras de ramen se usa para la mise en place de toppings de contraste: hebras de daikon, zanahoria y pepino que aportan frescor, color y textura crujiente sobre el tazón caliente. Su cuerpo de aluminio fundido lacado en verde menta, sus cuatro patas antideslizantes y sus mangos verdes lo han vuelto un clásico reconocible de las cocinas profesionales de Japón.",
    tareTitle: "⚙️ Anatomía de la Máquina",
    tare: [
      { icon: "🔩", name: "Cuerpo de Aluminio Fundido", desc: "Carcasa lacada verde menta, ligera y rígida, sobre cuatro patas antideslizantes." },
      { icon: "📌", name: "Soporte de Púas (Prong Holder)", desc: "Disco con púas que clava la verdura por el centro para que gire sin resbalar." },
      { icon: "🔪", name: "Hoja de Corte Ajustable", desc: "Acero inoxidable afilado; se acerca o aleja para elegir el grosor de la lámina." },
      { icon: "🔄", name: "Manivela de Mango Verde", desc: "Brazo de acero con empuñadura ergonómica que gira la verdura a velocidad constante." }
    ],
    stats: [
      { label: "Función:", val: "Pelar en Lámina Continua" },
      { label: "Grosor de Lámina:", val: "0.3 – 3 mm (ajustable)" },
      { label: "Precisión:", val: "★★★★★" },
      { label: "Ideal para:", val: "Daikon, Zanahoria & Pepino" }
    ],
    buffs: [
      "🥕 Los toppings de verdura (Poro, Cebolla China, Zanahoria) rinden una porción con menos esfuerzo",
      "💰 +15% de propina en pedidos con verduras en lámina",
      "✨ +160 Puntos de precisión milimétrica"
    ]
  }
];

let currentSecretIndex = 0;
let currentSecretFilter = 'todos';

function filterSecretosCategory(cat, btn) {
  playSound('click');
  currentSecretFilter = cat;
  
  const buttons = document.querySelectorAll('.secret-tab-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  renderSecretosCards(cat);
}

function renderSecretosCards(filterCat) {
  const container = document.getElementById("secretos-cards-container");
  if (!container) return;
  
  const items = (filterCat === 'todos' || !filterCat) 
    ? CHEF_SECRETS 
    : CHEF_SECRETS.filter(s => s.category === filterCat);
    
  container.innerHTML = items.map(item => {
    return `
      <div class="secret-card secret-card-unlocked" onclick="openSecretDetail('${item.id}')" title="¡Toca para ver el modelo 3D!">
        <div style="font-size: 11px; font-weight: 900; color: #ffe082; display: flex; align-items: center; gap: 4px; line-height: 1.2;">
          <span>${item.icon}</span> ${item.name}
        </div>
        <div class="secret-pedestal-preview" style="background: radial-gradient(circle, rgba(255, 179, 0, 0.45) 0%, rgba(37, 14, 52, 0.9) 70%); border: 2px solid #ffd54f; box-shadow: 0 0 14px rgba(255, 213, 79, 0.6); animation: floatPedestal 3s ease-in-out infinite;">
          <span style="font-size: 26px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));">${item.icon}</span>
        </div>
        <div style="font-size: 8.5px; color: #ffecb3; font-weight: 700; margin: 2px 0; line-height: 1.2;">${item.subtitle}</div>
        <div class="secret-req-badge" style="background: linear-gradient(90deg, #ff8f00, #ffb300); color: #211000; font-weight: 900; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 8px; animation: pulseGlow 2s infinite; cursor: pointer;">
          ✨ DESBLOQUEADO (Ver 3D)
        </div>
      </div>
    `;
  }).join('');
}

function openSecretDetail(secretId) {
  playSound('click');
  const index = CHEF_SECRETS.findIndex(s => s.id === secretId);
  if (index !== -1) {
    currentSecretIndex = index;
  }
  
  const item = CHEF_SECRETS[currentSecretIndex];
  
  const secretosModal = document.getElementById("secretos-modal");
  if (secretosModal) secretosModal.classList.remove("active");

  const modal = document.getElementById("secreto-detail-modal");
  if (modal) {
    modal.classList.add("active");
  }

  renderSecretReview(item);

  requestAnimationFrame(() => {
    initOrResumeTamago3D(item);
    setTimeout(resizeTamagoViewport, 60);
  });
}

function openTamagoSecretDetail() {
  openSecretDetail('tamago');
}

function navigateSecret(dir) {
  playSound('click');
  currentSecretIndex = (currentSecretIndex + dir + CHEF_SECRETS.length) % CHEF_SECRETS.length;
  const item = CHEF_SECRETS[currentSecretIndex];
  renderSecretReview(item);
  loadSecret3DModel(item);
  resetTamagoCamera();
}

function renderSecretReview(item) {
  if (!item) return;

  const iconEl = document.getElementById("secreto-modal-icon");
  const titleEl = document.getElementById("secreto-modal-title");
  const badgeEl = document.getElementById("secreto-modal-badge");
  
  if (iconEl) iconEl.textContent = item.icon;
  if (titleEl) titleEl.textContent = `SECRETO DEL CHEF • ${item.name.toUpperCase()} (${item.kanji})`;
  if (badgeEl) badgeEl.textContent = item.category.toUpperCase();

  const loreBadge = document.getElementById("lore-badge-tag");
  const loreTitle = document.getElementById("lore-main-title");
  const loreSubtitle = document.getElementById("lore-subtitle");
  const loreContent = document.getElementById("lore-story-content");
  const tareTitle = document.getElementById("lore-tare-title");
  const tareGrid = document.getElementById("lore-tare-grid");
  const statsGrid = document.getElementById("lore-stats-grid");
  const buffsList = document.getElementById("lore-buff-list");

  if (loreBadge) loreBadge.textContent = `⭐ ${item.category.toUpperCase()} • MAESTRÍA ARTESANAL`;
  if (loreTitle) loreTitle.textContent = `${item.icon} ${item.name} (${item.kanji})`;
  if (loreSubtitle) loreSubtitle.textContent = item.subtitle;

  if (loreContent) {
    const paragraphs = item.lore.split('\n\n').map(p => `<p style="margin-bottom:6px;">${p}</p>`).join('');
    loreContent.innerHTML = paragraphs;
  }

  if (tareTitle) tareTitle.textContent = item.tareTitle || "🧂 Componentes & Elaboración";

  if (tareGrid && item.tare) {
    tareGrid.innerHTML = item.tare.map(t => `
      <div class="tare-item">
        <span class="tare-icon">${t.icon}</span>
        <div>
          <div class="tare-name">${t.name}</div>
          <div class="tare-desc">${t.desc}</div>
        </div>
      </div>
    `).join('');
  }

  if (statsGrid && item.stats) {
    statsGrid.innerHTML = item.stats.map(s => `
      <div class="stat-row">
        <span class="stat-label">${s.label}</span>
        <span class="stat-val">${s.val}</span>
      </div>
    `).join('');
  }

  if (buffsList && item.buffs) {
    buffsList.innerHTML = item.buffs.map(b => `
      <li>${b}</li>
    `).join('');
  }
}

function closeTamagoSecretDetail() {
  playSound('click');
  const modal = document.getElementById("secreto-detail-modal");
  if (modal) {
    modal.classList.remove("active");
  }
  stopTamago3D();
}

function backToSecretosGallery() {
  playSound('click');
  closeTamagoSecretDetail();
  openSecretosModal();
}
