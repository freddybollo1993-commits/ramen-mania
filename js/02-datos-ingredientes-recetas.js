/* Módulo 02-datos-ingredientes-recetas — Datos: ingredientes, arte de ingredientes y catálogos de recetas.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */



const INGREDIENTES = [
  {"id": 1, "name": "fideo ramen", "cat": "bases", "areas": ["ramen","salteados"], "icon": "🥢", "display": "Fideo Ramen", "img": "assets/ingredients/ing_1_fideo_ramen.svg"},
  {"id": 2, "name": "Caldo Shio", "cat": "bases", "areas": ["ramen"], "icon": "🥣", "display": "Caldo Shio", "img": "assets/ingredients/ing_2_caldo_shio.svg"},
  {"id": 3, "name": "caldo tonkotsu", "cat": "bases", "areas": ["ramen"], "icon": "🫕", "display": "Caldo Tonkotsu", "img": "assets/ingredients/ing_3_caldo_tonkotsu.svg"},
  {"id": 4, "name": "agua", "cat": "bases", "areas": ["ramen"], "icon": "💧", "display": "Agua", "img": "assets/ingredients/ing_4_agua.svg"},
  {"id": 5, "name": "Salsa Shoyu", "cat": "salsas", "areas": ["ramen"], "icon": "🍶", "display": "Salsa Shoyu", "img": "assets/ingredients/ing_5_salsa_shoyu.svg"},
  {"id": 6, "name": "salsa miso", "cat": "salsas", "areas": ["ramen"], "icon": "🍲", "display": "Salsa Miso", "img": "assets/ingredients/ing_6_salsa_miso.svg"},
  {"id": 7, "name": "salsa ebi ramen", "cat": "salsas", "areas": ["ramen"], "icon": "🦐", "display": "Salsa Ebi", "img": "assets/ingredients/ing_7_salsa_ebi.svg"},
  {"id": 8, "name": "salsa tan tan", "cat": "salsas", "areas": ["ramen","salteados"], "icon": "🌶️", "display": "Salsa Tan Tan", "img": "assets/ingredients/ing_8_salsa_tantan.svg"},
  {"id": 9, "name": "salsa vegetariana", "cat": "salsas", "areas": ["ramen"], "icon": "🥬", "display": "Salsa Vegetariana", "img": "assets/ingredients/ing_9_salsa_vegetariana.svg"},
  {"id": 10, "name": "salsa bajiru", "cat": "salsas", "areas": ["ramen"], "icon": "🌿", "display": "Salsa Bajiru", "img": "assets/ingredients/ing_10_salsa_bajiru.svg"},
  {"id": 11, "name": "Chasu Asado", "cat": "proteinas", "areas": ["ramen"], "icon": "🥩", "display": "Chasu Asado", "img": "assets/ingredients/ing_11_chasu_asado.svg"},
  {"id": 12, "name": "brisket laminado", "cat": "proteinas", "areas": ["ramen"], "icon": "🥓", "display": "Brisket Laminado", "img": "assets/ingredients/ing_12_brisket.svg"},
  {"id": 13, "name": "chancho molido", "cat": "proteinas", "areas": ["ramen"], "icon": "🍖", "display": "Chancho Molido", "img": "assets/ingredients/ing_13_chancho_molido.svg"},
  {"id": 14, "name": "langostinos", "cat": "proteinas", "areas": ["ramen"], "icon": "🍤", "display": "Langostinos", "img": "assets/ingredients/ing_14_langostinos.svg"},
  {"id": 15, "name": "Huevo", "cat": "proteinas", "areas": ["ramen","frituras","salteados"], "icon": "🥚", "display": "Huevo", "img": "assets/ingredients/ing_15_huevo.svg"},
  {"id": 16, "name": "triángulos de tofu", "cat": "proteinas", "areas": ["ramen"], "icon": "🧈", "display": "Tofu Triángulos", "img": "assets/ingredients/ing_16_tofu.svg"},
  {"id": 17, "name": "Poro", "cat": "vegetales", "areas": ["ramen"], "icon": "🌱", "display": "Poro", "img": "assets/ingredients/ing_17_poro.svg"},
  {"id": 18, "name": "Cebolla China", "cat": "vegetales", "areas": ["ramen"], "icon": "🧅", "display": "Cebolla China", "img": "assets/ingredients/ing_18_cebolla_china.svg"},
  {"id": 19, "name": "Ajonjolí Blanco", "cat": "vegetales", "areas": ["ramen"], "icon": "✨", "display": "Ajonjolí Blanco", "img": "assets/ingredients/ing_19_ajonjoli_blanco.svg"},
  {"id": 20, "name": "alga nori", "cat": "vegetales", "areas": ["ramen","makis"], "icon": "⬛", "display": "Nori", "img": "assets/ingredients/ing_20_nori.svg"},
  {"id": 21, "name": "alga wanji", "cat": "vegetales", "areas": ["ramen"], "icon": "🌿", "display": "Alga Wanji", "img": "assets/ingredients/ing_21_alga_wanji.svg"},
  {"id": 22, "name": "bambú laminado", "cat": "vegetales", "areas": ["ramen"], "icon": "🎍", "display": "Bamboo", "img": "assets/ingredients/ing_22_bamboo.svg"},
  {"id": 23, "name": "holantao", "cat": "vegetales", "areas": ["ramen","salteados"], "icon": "🫛", "display": "Holantao", "img": "assets/ingredients/ing_23_holantao.svg"},
  {"id": 24, "name": "col cocida", "cat": "vegetales", "areas": ["ramen"], "icon": "🥬", "display": "Col Cocida", "img": "assets/ingredients/ing_24_col_cocida.svg"},
  {"id": 25, "name": "moyashi", "cat": "vegetales", "areas": ["ramen","salteados"], "icon": "🌾", "display": "Moyashi", "img": "assets/ingredients/ing_25_moyashi.svg"},
  {"id": 27, "name": "champiñones", "cat": "vegetales", "areas": ["ramen","salteados"], "icon": "🍄", "display": "Champiñones", "img": "assets/ingredients/ing_27_champinones.svg"},
  {"id": 28, "name": "shitake", "cat": "vegetales", "areas": ["ramen"], "icon": "🟫", "display": "Shitake", "img": "assets/ingredients/ing_28_shitake.svg"},
  {"id": 29, "name": "Espárrago", "cat": "vegetales", "areas": ["ramen","salteados"], "icon": "🎋", "display": "Espárrago", "img": "assets/ingredients/ing_29_esparrago.svg"},
  {"id": 30, "name": "zanahoria", "cat": "vegetales", "areas": ["ramen","frituras","salteados"], "icon": "🥕", "display": "Zanahoria", "img": "assets/ingredients/ing_30_zanahoria.svg"},

  // --- Ingredientes nuevos (Frituras / Makis / Salteados) — sin arte SVG todavía, usan icon emoji como placeholder ---
  {"id": 31, "name": "aceite ajonjolí", "cat": "salsas", "areas": ["frituras"], "icon": "🧴", "display": "Aceite Ajonjolí", "img": null},
  {"id": 32, "name": "ajo chino", "cat": "vegetales", "areas": ["frituras"], "icon": "🧄", "display": "Ajo Chino", "img": null},
  {"id": 33, "name": "ajonjolí blanco", "cat": "vegetales", "areas": ["salteados"], "icon": "⚪", "display": "Ajonjolí Blanco", "img": null},
  {"id": 34, "name": "ajonjolí negro", "cat": "vegetales", "areas": ["makis","salteados"], "icon": "⚫", "display": "Ajonjolí Negro", "img": null},
  {"id": 35, "name": "ají limo", "cat": "vegetales", "areas": ["salteados"], "icon": "🌶️", "display": "Ají Limo", "img": null},
  {"id": 36, "name": "alas de pollo", "cat": "proteinas", "areas": ["frituras"], "icon": "🍗", "display": "Alas de Pollo", "img": null},
  {"id": 37, "name": "arroz gohan", "cat": "bases", "areas": ["salteados"], "icon": "🍚", "display": "Arroz Gohan", "img": null},
  {"id": 38, "name": "arroz shari", "cat": "bases", "areas": ["makis"], "icon": "🍙", "display": "Arroz Shari", "img": null},
  {"id": 39, "name": "atún", "cat": "proteinas", "areas": ["makis"], "icon": "🐟", "display": "Atún", "img": null},
  {"id": 40, "name": "base shimaya", "cat": "salsas", "areas": ["salteados"], "icon": "🥫", "display": "Base Yakimeshi", "img": null},
  {"id": 41, "name": "benishoga", "cat": "vegetales", "areas": ["salteados"], "icon": "🌸", "display": "Benishoga", "img": null},
  {"id": 42, "name": "beterraga", "cat": "vegetales", "areas": ["frituras","salteados"], "icon": "🍠", "display": "Beterraga", "img": null},
  {"id": 43, "name": "bife de cerdo", "cat": "proteinas", "areas": ["frituras"], "icon": "🥩", "display": "Bife de Cerdo", "img": null},
  {"id": 44, "name": "bife de pollo", "cat": "proteinas", "areas": ["frituras"], "icon": "🍗", "display": "Bife de Pollo", "img": null},
  {"id": 45, "name": "brócoli", "cat": "vegetales", "areas": ["salteados"], "icon": "🥦", "display": "Brócoli", "img": null},
  {"id": 46, "name": "cebolla", "cat": "vegetales", "areas": ["salteados"], "icon": "🧅", "display": "Cebolla", "img": null},
  {"id": 47, "name": "cecina", "cat": "proteinas", "areas": ["makis"], "icon": "🥓", "display": "Cecina", "img": null},
  {"id": 48, "name": "chancho chaufa", "cat": "proteinas", "areas": ["salteados"], "icon": "🍖", "display": "Chancho Chaufa", "img": null},
  {"id": 49, "name": "cobertura de atún", "cat": "proteinas", "areas": ["makis"], "icon": "🐟", "display": "Cobertura de Atún", "img": null},
  {"id": 50, "name": "cobertura de conchas de abanico", "cat": "proteinas", "areas": ["makis"], "icon": "🐚", "display": "Cobertura de Conchas", "img": null},
  {"id": 51, "name": "cobertura para amazon", "cat": "proteinas", "areas": ["makis"], "icon": "🌿", "display": "Cobertura Amazon", "img": null},
  {"id": 52, "name": "col", "cat": "vegetales", "areas": ["frituras","salteados"], "icon": "🥬", "display": "Col", "img": null},
  {"id": 53, "name": "condimentos", "cat": "otros", "areas": ["frituras"], "icon": "🧂", "display": "Condimentos", "img": null},
  {"id": 54, "name": "ebi (langostino)", "cat": "proteinas", "areas": ["makis"], "icon": "🍤", "display": "Ebi (Langostino)", "img": null},
  {"id": 55, "name": "ensalada", "cat": "vegetales", "areas": ["salteados"], "icon": "🥗", "display": "Ensalada", "img": null},
  {"id": 56, "name": "ensalada fría", "cat": "vegetales", "areas": ["salteados"], "icon": "🥗", "display": "Ensalada Fría", "img": null},
  {"id": 57, "name": "gohan", "cat": "bases", "areas": ["frituras"], "icon": "🍚", "display": "Gohan", "img": null},
  {"id": 58, "name": "harina", "cat": "otros", "areas": ["frituras"], "icon": "🌾", "display": "Harina", "img": null},
  {"id": 59, "name": "hilos de wantán", "cat": "otros", "areas": ["makis"], "icon": "🍜", "display": "Hilos de Wantán", "img": null},
  {"id": 60, "name": "langostino (6 und)", "cat": "proteinas", "areas": ["frituras"], "icon": "🍤", "display": "Langostino (6 und)", "img": null},
  {"id": 61, "name": "lomo", "cat": "proteinas", "areas": ["salteados"], "icon": "🥩", "display": "Lomo", "img": null},
  {"id": 62, "name": "mayonesa de la casa", "cat": "salsas", "areas": ["frituras"], "icon": "🥫", "display": "Mayonesa de la Casa", "img": null},
  {"id": 63, "name": "negi", "cat": "vegetales", "areas": ["salteados"], "icon": "🌱", "display": "Negi", "img": null},
  {"id": 64, "name": "palta", "cat": "vegetales", "areas": ["makis"], "icon": "🥑", "display": "Palta", "img": null},
  {"id": 65, "name": "panko", "cat": "otros", "areas": ["frituras"], "icon": "🍞", "display": "Panko", "img": null},
  {"id": 66, "name": "pasta", "cat": "otros", "areas": ["frituras"], "icon": "🥟", "display": "Pasta", "img": null},
  {"id": 67, "name": "pimentón", "cat": "vegetales", "areas": ["salteados"], "icon": "🫑", "display": "Pimentón", "img": null},
  {"id": 68, "name": "pimiento", "cat": "vegetales", "areas": ["salteados"], "icon": "🫑", "display": "Pimiento", "img": null},
  {"id": 69, "name": "pollo", "cat": "proteinas", "areas": ["salteados"], "icon": "🍗", "display": "Pollo", "img": null},
  {"id": 70, "name": "pollo (7 piezas)", "cat": "proteinas", "areas": ["frituras"], "icon": "🍗", "display": "Pollo (7 piezas)", "img": null},
  {"id": 71, "name": "poro especial", "cat": "vegetales", "areas": ["salteados"], "icon": "🌱", "display": "Poro Especial", "img": null},
  {"id": 72, "name": "queso crema", "cat": "salsas", "areas": ["makis"], "icon": "🧀", "display": "Queso Crema", "img": null},
  {"id": 73, "name": "relleno de langostino y chancho", "cat": "proteinas", "areas": ["frituras"], "icon": "🥟", "display": "Relleno Langostino y Chancho", "img": null},
  {"id": 74, "name": "rulos de cebolla china", "cat": "vegetales", "areas": ["frituras","salteados"], "icon": "🧅", "display": "Rulos de Cebolla China", "img": null},
  {"id": 75, "name": "sal", "cat": "otros", "areas": ["frituras"], "icon": "🧂", "display": "Sal", "img": null},
  {"id": 76, "name": "salsa", "cat": "salsas", "areas": ["frituras"], "icon": "🥫", "display": "Salsa", "img": null},
  {"id": 77, "name": "salsa acevichada", "cat": "salsas", "areas": ["makis"], "icon": "🍶", "display": "Salsa Acevichada", "img": null},
  {"id": 78, "name": "salsa batayaki", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Salsa Batayaki", "img": null},
  {"id": 79, "name": "salsa chaufa", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Base Chaufa", "img": null},
  {"id": 80, "name": "salsa digion", "cat": "salsas", "areas": ["makis"], "icon": "🍶", "display": "Salsa Digión", "img": null},
  {"id": 81, "name": "salsa guacamole", "cat": "salsas", "areas": ["makis"], "icon": "🥑", "display": "Salsa Guacamole", "img": null},
  {"id": 82, "name": "salsa hotate", "cat": "salsas", "areas": ["makis"], "icon": "🍶", "display": "Salsa Hotate", "img": null},
  {"id": 83, "name": "salsa kare", "cat": "salsas", "areas": ["frituras"], "icon": "🍛", "display": "Salsa Kare", "img": null},
  {"id": 84, "name": "salsa katsu", "cat": "salsas", "areas": ["frituras","salteados"], "icon": "🍶", "display": "Salsa Katsu", "img": null},
  {"id": 85, "name": "salsa nin niku", "cat": "salsas", "areas": ["makis"], "icon": "🍶", "display": "Salsa Nin Niku", "img": null},
  {"id": 86, "name": "salsa omuraisu", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Salsa Omuraisu", "img": null},
  {"id": 87, "name": "salsa teriyaki", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Salsa Teriyaki", "img": null},
  {"id": 88, "name": "salsa yakitori", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Salsa Yakitori", "img": null},
  {"id": 89, "name": "salsa yama", "cat": "salsas", "areas": ["makis"], "icon": "🍶", "display": "Salsa Yama", "img": null},
  {"id": 90, "name": "salsa yasaitame", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Salsa Yasaitame", "img": null},
  {"id": 91, "name": "togarashi", "cat": "otros", "areas": ["frituras"], "icon": "🌶️", "display": "Togarashi", "img": null},
  {"id": 92, "name": "toping", "cat": "otros", "areas": ["frituras"], "icon": "✨", "display": "Toping", "img": null},
  {"id": 93, "name": "tortilla", "cat": "otros", "areas": ["salteados"], "icon": "🍳", "display": "Tortilla", "img": null},
  {"id": 94, "name": "wantán", "cat": "otros", "areas": ["salteados"], "icon": "🥟", "display": "Wantán", "img": null},
  {"id": 95, "name": "zucchini", "cat": "vegetales", "areas": ["salteados"], "icon": "🥒", "display": "Zucchini", "img": null},
  {"id": 96, "name": "wasabi", "cat": "otros", "areas": [], "icon": "🌿", "display": "Wasabi", "img": null},
  {"id": 97, "name": "jengibre", "cat": "otros", "areas": [], "icon": "🌸", "display": "Jengibre (gari)", "img": null},
  {"id": 98, "name": "salsa ponzu", "cat": "salsas", "areas": ["salteados"], "icon": "🍋", "display": "Salsa Ponzu", "img": null},
  {"id": 99, "name": "licor de arroz", "cat": "salsas", "areas": ["salteados"], "icon": "🍶", "display": "Licor de Arroz", "img": null},
  {"id": 100, "name": "mantequilla", "cat": "otros", "areas": ["salteados"], "icon": "🧈", "display": "Mantequilla", "img": null},
  {"id": 101, "name": "aceite yakitori", "cat": "salsas", "areas": ["salteados"], "icon": "🫒", "display": "Aceite Yakitori", "img": null},
  {"id": 102, "name": "limón", "cat": "vegetales", "areas": ["salteados"], "icon": "🍋", "display": "Limón", "img": null},
  {"id": 103, "name": "cebolla caramelizada", "cat": "vegetales", "areas": ["salteados"], "icon": "🧅", "display": "Cebolla Caramelizada", "img": null},
  {"id": 104, "name": "pollo cuadrado", "cat": "proteinas", "areas": ["salteados"], "icon": "🍗", "display": "Pollo Cuadrado", "img": null},
  {"id": 105, "name": "pollo en tiras", "cat": "proteinas", "areas": ["salteados"], "icon": "🍗", "display": "Pollo en Tiras", "img": null},
  {"id": 106, "name": "pollo teriyaki", "cat": "proteinas", "areas": ["salteados"], "icon": "🍗", "display": "Pollo Teriyaki", "img": null},
  {"id": 107, "name": "pollo yakitori", "cat": "proteinas", "areas": ["salteados"], "icon": "🍢", "display": "Pollo Yakitori", "img": null},
  {"id": 109, "name": "frutos secos", "cat": "otros", "areas": ["salteados"], "icon": "🥜", "display": "Frutos Secos", "img": null},
  {"id": 110, "name": "atún (pieza)", "cat": "proteinas", "areas": ["makis"], "icon": "🐟", "display": "Atún (pieza)", "img": null},
  {"id": 111, "name": "conchas de abanico", "cat": "proteinas", "areas": ["makis"], "icon": "🦪", "display": "Conchas de abanico", "img": null},
  // Recetas v176 (ingredientes nuevos; sin arte propio todavía: usan su emoji)
  {"id": 112, "name": "pichikata", "cat": "otros", "areas": ["frituras"], "icon": "🧂", "display": "Pichikata", "img": null},
  {"id": 113, "name": "culantro", "cat": "vegetales", "areas": ["frituras"], "icon": "🌿", "display": "Culantro", "img": null},
  {"id": 114, "name": "camote", "cat": "vegetales", "areas": ["frituras", "makis"], "icon": "🍠", "display": "Camote", "img": null},
  {"id": 115, "name": "chuño", "cat": "otros", "areas": ["frituras"], "icon": "🥔", "display": "Chuño", "img": null},
  {"id": 116, "name": "chifle", "cat": "otros", "areas": ["makis"], "icon": "🍌", "display": "Chifle", "img": null},
  {"id": 117, "name": "kiury", "cat": "vegetales", "areas": ["salteados"], "icon": "🥒", "display": "Kiury", "img": null},
  {"id": 118, "name": "salsa poke de atún", "cat": "salsas", "areas": ["salteados"], "icon": "🍣", "display": "Salsa Poke de Atún", "short": "Poke Atún", "img": null},
  {"id": 119, "name": "layu", "cat": "salsas", "areas": ["makis"], "icon": "🌶️", "display": "Layu", "img": null},
  {"id": 120, "name": "tar tar de atún", "cat": "proteinas", "areas": ["makis"], "icon": "🐟", "display": "Tar Tar de Atún", "short": "Tar Tar Atún", "img": null},
  {"id": 121, "name": "rodaja de limón", "cat": "vegetales", "areas": ["makis"], "icon": "🍋", "display": "Rodaja de Limón", "short": "Rod. Limón", "img": null}
];
// Un ingrediente que se usa en otra área también debe figurar en ella (despensa y Reconocer)
[[5, 'makis'], [18, 'salteados', 'frituras', 'makis'], [21, 'salteados'], [34, 'frituras'], [35, 'frituras'], [62, 'salteados'], [74, 'ramen'],
 [77, 'frituras'], [80, 'frituras'], [87, 'makis', 'frituras'], [91, 'makis'], [98, 'frituras']].forEach(([id, ...as]) => {
  const i = INGREDIENTES.find(x => x.id === id);
  if (i) as.forEach(a => { if (!i.areas.includes(a)) i.areas.push(a); });
});
// Nombre corto para las fichas del panel (en pantallas angostas el nombre completo se cortaba) y
// iconos propios donde dos ingredientes de la misma área compartían el mismo.
// Arte generado con tools/gen-ingredient-icons.mjs (id -> SVG 64x64). Los emoji quedan solo de respaldo.
const ING_ART = {"31":"assets/ingredients/ing_31_aceite_ajonjoli.svg","32":"assets/ingredients/ing_32_ajo_chino.svg","33":"assets/ingredients/ing_33_ajonjoli.svg","34":"assets/ingredients/ing_34_ajonjoli_negro.svg","35":"assets/ingredients/ing_35_aji_limo.svg","36":"assets/fry/fry_36_alitas.svg","37":"assets/ingredients/ing_37_arroz.svg","38":"assets/ingredients/ing_38_arroz_shari.svg","39":"assets/ingredients/ing_39_atun.svg","40":"assets/ingredients/ing_40_sachet_base_yakimeshi.svg","41":"assets/ingredients/ing_41_benishoga.svg","42":"assets/ingredients/ing_42_beterraga.svg","43":"assets/fry/fry_43_bife_cerdo.svg","44":"assets/fry/fry_44_bife_pollo.svg","45":"assets/ingredients/ing_45_brocoli.svg","46":"assets/ingredients/ing_46_cebolla.svg","47":"assets/ingredients/ing_47_cecina.svg","48":"assets/ingredients/ing_48_chancho_chaufa.svg","49":"assets/ingredients/ing_49_cobertura_atun.svg","50":"assets/ingredients/ing_50_cobertura_conchas.svg","51":"assets/ingredients/ing_51_cobertura_amazon.svg","52":"assets/ingredients/ing_52_col.svg","53":"assets/ingredients/ing_53_condimentos.svg","54":"assets/ingredients/ing_54_ebi.svg","55":"assets/ingredients/ing_55_ensalada.svg","56":"assets/ingredients/ing_56_ensalada_fria.svg","57":"assets/ingredients/ing_57_gohan.svg","58":"assets/ingredients/ing_58_harina.svg","59":"assets/ingredients/ing_59_hilos_wantan.svg","60":"assets/fry/fry_60_langostinos.svg","61":"assets/ingredients/ing_61_lomo.svg","62":"assets/ingredients/ing_62_mayonesa_casa.svg","63":"assets/ingredients/ing_63_negi.svg","64":"assets/ingredients/ing_64_palta.svg","65":"assets/ingredients/ing_65_panko.svg","66":"assets/ingredients/ing_66_pasta_gyoza.svg","67":"assets/ingredients/ing_67_pimenton.svg","68":"assets/ingredients/ing_68_pimiento.svg","69":"assets/ingredients/ing_69_pollo.svg","70":"assets/fry/fry_70_pollo.svg","71":"assets/ingredients/ing_71_poro_especial.svg","72":"assets/ingredients/ing_72_queso_crema.svg","73":"assets/fry/fry_73_gyoza.svg","74":"assets/ingredients/ing_74_rulos_cebolla.svg","75":"assets/ingredients/ing_75_sal.svg","76":"assets/ingredients/ing_76_salsa.svg","77":"assets/ingredients/ing_77_salsa_acevichada.svg","78":"assets/ingredients/ing_78_sachet_salsa_batayaki.svg","79":"assets/ingredients/ing_79_sachet_base_chaufa.svg","80":"assets/ingredients/ing_80_salsa_digion.svg","81":"assets/ingredients/ing_81_salsa_guacamole.svg","82":"assets/ingredients/ing_82_salsa_hotate.svg","83":"assets/ingredients/ing_83_salsa_kare.svg","84":"assets/ingredients/ing_84_salsa_katsu.svg","85":"assets/ingredients/ing_85_salsa_nin_niku.svg","86":"assets/ingredients/ing_86_sachet_salsa_omuraisu.svg","87":"assets/ingredients/ing_87_salsa_teriyaki.svg","88":"assets/ingredients/ing_88_salsa_yakitori.svg","89":"assets/ingredients/ing_89_salsa_yama.svg","90":"assets/ingredients/ing_90_salsa_yasaitame.svg","91":"assets/ingredients/ing_91_togarashi.svg","92":"assets/ingredients/ing_92_toping.svg","93":"assets/ingredients/ing_93_tortilla.svg","94":"assets/ingredients/ing_94_wantan.svg","95":"assets/ingredients/ing_95_zucchini.svg","96":"assets/ingredients/ing_96_wasabi.svg","97":"assets/ingredients/ing_97_jengibre.svg","98":"assets/ingredients/ing_98_salsa_ponzu.svg","104":"assets/ingredients/ing_104_pollo_cuadrado.svg","105":"assets/ingredients/ing_105_pollo_tiras.svg","106":"assets/ingredients/ing_106_pollo_teriyaki.svg","107":"assets/ingredients/ing_107_pollo_yakitori.svg"};
const ING_SHORT = { 73: 'Relleno Gyoza', 60: 'Langostino ×6', 70: 'Pollo ×7', 62: 'Mayo Casa', 74: 'Rulos Cebolla',
  49: 'Cob. Atún', 54: 'Ebi Langost.', 77: 'Acevichada', 50: 'Cob. Conchas', 51: 'Cob. Amazon', 28: 'Shitake', 21: 'Alga Wanji' };
const ING_ICON_FIX = { 62: '🍯', 76: '🍅', 53: '🌿', 44: '🐔', 70: '🍖', 49: '🍣' };
// Icono del ingrediente en línea (SVG si existe, emoji si no).
// Algunos ingredientes se ven distinto según el área: en Salteado el huevo es CRUDO (ing_raw_15) y el lomo que se usa en cocina es el ya CORTADO
const ING_CTX_ART = { salteados: { 15: 'assets/ingredients/v2/ing_raw_15.webp', 61: 'assets/ingredients/ing_proc_61_lomo.svg' } };
function ingCtxImg(ing) {
  if (!ing) return null;
  try { const m = ING_CTX_ART[gameState.activeArea]; if (m && m[ing.id]) return m[ing.id]; } catch (e) {}
  return ing.img || null;
}
function ingIconHtml(ing) {
  if (!ing) return '❓';
  const src = ingCtxImg(ing);
  return src ? `<img class="ing-ico" src="${src}" alt="" draggable="false">` : ing.icon;
}
INGREDIENTES.forEach(i => {
  if (!i.img && ING_ART[i.id]) i.img = ING_ART[i.id];
  if (ING_SHORT[i.id]) i.short = ING_SHORT[i.id];
  if (ING_ICON_FIX[i.id]) i.icon = ING_ICON_FIX[i.id];
});
// Insumos de Producción: dos estados. CRUDO (fresco, como llega) se ve en Producción; PROCESADO (cortado / cocido,
// listo para usar) es el icono normal y se ve al emplatar. Arte generado con tools/gen-production-icons.mjs.
const ING_RAW_ART = {
  15: 'assets/ingredients/v2/ing_raw_15.webp', 17: 'assets/ingredients/v2/ing_raw_17.webp', 18: 'assets/ingredients/v2/ing_raw_18.webp',
  20: 'assets/ingredients/ing_20_nori.svg', 21: 'assets/ingredients/ing_21_alga_wanji.svg', 22: 'assets/ingredients/v2/ing_raw_22.webp',
  23: 'assets/ingredients/ing_23_holantao.svg', 24: 'assets/ingredients/v2/ing_raw_24.webp', 25: 'assets/ingredients/v2/ing_raw_25.webp',
  27: 'assets/ingredients/ing_27_champinones.svg', 28: 'assets/ingredients/ing_28_shitake.svg', 29: 'assets/ingredients/ing_29_esparrago.svg',
  30: 'assets/ingredients/v2/ing_raw_30.webp',
  61: 'assets/ingredients/v2/ing_raw_61.webp'      // Salteado, Producción: el lomo entero que se corta
};
const ING_PROC_ART = {
  17: 'assets/ingredients/ing_proc_17_poro.svg', 18: 'assets/ingredients/ing_proc_18_cebolla_china.svg', 20: 'assets/ingredients/ing_proc_20_nori.svg',
  21: 'assets/ingredients/ing_proc_21_alga_wanji.svg', 23: 'assets/ingredients/ing_proc_23_holantao.svg', 27: 'assets/ingredients/ing_proc_27_champinones.svg',
  28: 'assets/ingredients/ing_proc_28_shitake.svg', 29: 'assets/ingredients/ing_proc_29_esparrago.svg'
};
INGREDIENTES.forEach(i => {
  if (ING_PROC_ART[i.id]) i.img = ING_PROC_ART[i.id];
  if (ING_RAW_ART[i.id]) i.rawImg = ING_RAW_ART[i.id];
});
// Arte v2 (generado con Gemini, WebP 160 px con contorno blanco): reemplaza el icono normal / procesado de estos ingredientes.
// El estado CRUDO específico (ing_raw_*, Producción y huevo / lomo de Salteado) también es arte v2 desde la hoja de crudos (v240).
const ING_ART_V2 = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,109,110,111,112,113,114,115,116,117,118,119,120,121]);
const ING_ART_V2_ALIAS = { 37: 57 };      // Arroz Gohan (Salteado) usa el dibujo del cuenco de Gohan
INGREDIENTES.forEach(i => {
  if (!ING_ART_V2.has(i.id)) return;
  const f = 'assets/ingredients/v2/ing_' + (ING_ART_V2_ALIAS[i.id] || i.id) + '.webp';
  i.img = f;
  if (i.rawImg && !/ing_raw_/.test(i.rawImg)) i.rawImg = f;      // el "crudo" que era el mismo dibujo normal pasa también al arte nuevo
});


const RECETAS_RAMEN = [
  {"id": 1, "name": "Shio", "price": 38, "desc": "Caldo Shio ligero, Chasu Asado, moyashi, nori y Ajonjolí Blanco", "ingredients": [1, 2, 11, 15, 17, 18, 19, 20, 25, 74]},
  {"id": 2, "name": "Shoyu", "price": 40, "desc": "Caldo Shio con Salsa Shoyu, Chasu Asado, bambú, holantao y nori", "ingredients": [1, 2, 5, 11, 15, 17, 18, 19, 20, 22, 23, 74]},
  {"id": 3, "name": "Miso", "price": 42, "desc": "Caldo Shio con salsa miso intensa, Chasu Asado, bambú, holantao y nori", "ingredients": [1, 2, 6, 11, 15, 17, 18, 19, 20, 22, 23, 74]},
  {"id": 4, "name": "Tonkotsu", "price": 46, "desc": "Caldo Tonkotsu espeso, col cocida, moyashi, Chasu Asado y nori", "ingredients": [1, 3, 11, 15, 17, 18, 19, 20, 24, 25, 74]},
  {"id": 5, "name": "Chashu", "price": 48, "desc": "Foco en Chasu Asado con caldo tonkotsu, nori y Huevo", "ingredients": [1, 3, 11, 15, 17, 18, 19, 20, 74]},
  {"id": 6, "name": "Ebi", "price": 50, "desc": "Langostinos, salsa ebi ramen, champiñones, Espárrago y nori", "ingredients": [1, 2, 7, 14, 15, 17, 18, 19, 20, 27, 29, 74]},
  {"id": 7, "name": "Tan tan", "price": 45, "desc": "Chancho molido picante, salsa tan tan, moyashi y nori", "ingredients": [1, 2, 8, 13, 15, 17, 18, 19, 20, 25, 74]},
  {"id": 8, "name": "Vegetariano", "price": 42, "desc": "Base de agua, shitake, champiñones, Espárrago, tofu, nori y salsa vegetariana", "ingredients": [1, 4, 9, 16, 17, 18, 19, 20, 22, 27, 28, 29, 74]},
  {"id": 9, "name": "Bajiru", "price": 48, "desc": "Salsa bajiru (albahaca), brisket laminado, alga wanji, nori y zanahoria", "ingredients": [1, 2, 10, 12, 15, 17, 19, 20, 21, 30, 74]}
];

// --- Frituras: cada receta usa un temporizador de punto óptimo (ver la estación de Frituras) ---
// Nota: "Gyozas" y "Age Gyozas" comparten exactamente los mismos ingredientes.
// Se distinguen por el campo "metodo" (hervido vs frito). Las Gyozas hervidas aún no se pueden pedir (necesitan la 2.ª hornilla con sartén).
const RECETAS_FRITURAS = [
  {"id": 1, "name": "Gyozas", "metodo": "hervido", "price": 32, "desc": "Empanadillas hervidas de langostino y chancho", "ingredients": [66, 73, 32, 31, 53, 52, 74, 18, 42, 91, 98]},
  {"id": 2, "name": "Chicken Katsu", "price": 52, "desc": "Bife de pollo empanizado, col, zanahoria y salsa katsu", "ingredients": [44, 65, 58, 15, 112, 52, 30, 62, 74, 91, 57, 84]},
  {"id": 3, "name": "Age Gyozas", "metodo": "frito", "price": 36, "desc": "Empanadillas fritas de langostino y chancho, sobre col y betarraga con salsa teriyaki", "ingredients": [66, 73, 32, 31, 53, 52, 42, 18, 74, 91, 87]},
  {"id": 4, "name": "Alitas Acevichadas", "price": 34, "desc": "Alitas fritas bañadas en salsa acevichada con camote, culantro, ají limo y togarashi", "ingredients": [36, 77, 114, 113, 35, 91]},
  {"id": 9, "name": "Alitas Digión", "price": 34, "desc": "Alitas fritas con salsa digión, ajonjolí negro y cebolla china", "ingredients": [36, 80, 34, 18]},
  {"id": 5, "name": "Ebi Furai", "price": 44, "desc": "Langostinos empanizados con ensalada y salsa teriyaki", "ingredients": [60, 65, 58, 15, 52, 42, 62, 18, 74, 91, 87]},
  {"id": 6, "name": "Kaarage", "price": 38, "desc": "Pollo frito estilo karaage con mayonesa de la casa", "ingredients": [70, 115, 52, 30, 62, 91, 74]},
  {"id": 7, "name": "Katsu Kare", "price": 56, "desc": "Bife de cerdo empanizado con salsa kare", "ingredients": [43, 65, 58, 15, 112, 52, 42, 62, 74, 91, 57, 83]},
  {"id": 8, "name": "Tonkatsu", "price": 54, "desc": "Bife de cerdo empanizado con salsa katsu", "ingredients": [43, 65, 58, 15, 112, 52, 42, 62, 74, 91, 57, 84]}
];

// --- Makis: el orden de armado importa ---
// "ingredients" es la secuencia completa. Los primeros "baseCount" forman la ESTRUCTURA BASE: al
// completarla ya se puede enrollar el maki. El resto (coberturas, salsas, ajonjolí) se agrega
// encima, DESPUÉS de enrollar.
const RECETAS_MAKIS = [
  {"id": 1, "name": "Maki Acevichado", "price": 46, "baseCount": 4, "desc": "Arroz shari, nori, palta y langostino; encima cobertura de atún y salsa acevichada", "ingredients": [38, 20, 64, 54, 49, 77, 114, 91]},
  {"id": 2, "name": "Maki Furai", "price": 44, "baseCount": 5, "desc": "Arroz shari, nori, palta, langostino y queso crema (se termina en Frituras)", "ingredients": [38, 20, 64, 54, 72, 34]},
  {"id": 3, "name": "Maki Hotate", "price": 48, "baseCount": 4, "desc": "Arroz shari, nori, palta y langostino; encima conchas de abanico y salsa hotate", "ingredients": [38, 20, 64, 54, 50, 82, 91, 121]},
  {"id": 4, "name": "Maki California", "price": 42, "baseCount": 5, "desc": "Arroz shari, nori, palta, langostino y queso crema; encima ajonjolí negro", "ingredients": [38, 20, 64, 54, 72, 34, 5]},
  {"id": 5, "name": "Maki Guacamole", "price": 40, "baseCount": 4, "desc": "Arroz shari, nori, atún y wantán frito; encima salsa guacamole", "ingredients": [38, 20, 39, 59, 81, 119, 18, 91]},
  {"id": 6, "name": "Maki Yama", "price": 45, "baseCount": 4, "desc": "Arroz shari, nori, palta y langostino; encima salsa yama (flamear)", "ingredients": [38, 20, 64, 54, 89, 87, 120, 18, 91]},
  {"id": 7, "name": "Maki Nin Niku", "price": 45, "baseCount": 4, "desc": "Arroz shari, nori, palta y langostino; encima cobertura de atún, salsa nin niku (flamear) y togarashi", "ingredients": [38, 20, 64, 54, 49, 85, 91]},
  {"id": 8, "name": "Maki Amazon", "price": 43, "baseCount": 4, "desc": "Arroz shari, nori, palta y cecina; encima cobertura amazon", "ingredients": [38, 20, 64, 47, 51, 116]},
  {"id": 9, "name": "Maki Digion", "price": 45, "baseCount": 4, "desc": "Arroz shari, nori, palta y langostino; encima cobertura de atún y salsa digión (flamear)", "ingredients": [38, 20, 64, 54, 49, 80, 34]}
];

// --- Salteados: se cocinan en el wok o la sartén con tiempo de salteado (ver js/08-salteados-wok.js) ---
const RECETAS_SALTEADOS = [
  {"id": 1, "name": "Chaufa Shimaya", "price": 40, "desc": "Arroz chaufa con huevo, chancho, champiñones y wantán", "ingredients": [15, 37, 18, 25, 79, 48, 27, 94, 41]},
  {"id": 2, "name": "Chicken Teriyaki", "price": 38, "desc": "Pollo con salsa teriyaki, arroz y ensalada fría", "ingredients": [69, 87, 99, 37, 56, 52, 30, 62]},
  {"id": 3, "name": "Batayaki Ramen", "price": 44, "desc": "Lomo, champiñones y holantao en wok y fideos en sartén, ambos con salsa batayaki; al otro lado poro frito (pasado por harina) con salsa ponzu", "ingredients": [61, 27, 23, 1, 78, 98, 71, 35]},
  {"id": 4, "name": "Yakimeshi", "price": 39, "desc": "Arroz salteado con huevo, pollo, zanahoria y holantao", "ingredients": [15, 69, 37, 30, 67, 23, 40]},
  {"id": 5, "name": "Yakiramen", "price": 43, "desc": "Fideo ramen salteado con pollo y vegetales variados", "ingredients": [69, 46, 52, 95, 45, 68, 1, 25, 42]},
  {"id": 6, "name": "Yasaitame", "price": 37, "desc": "Salteado de vegetales con lomo y salsa yasaitame", "ingredients": [61, 46, 95, 52, 25, 45, 68, 90, 33]},
  {"id": 7, "name": "Yakitori", "price": 35, "desc": "Brochetas de pollo yakitori con ensalada de col, zanahoria, betarraga, kiury y alga wanji con salsa poke de atún", "ingredients": [69, 52, 30, 42, 117, 21, 118]},
  {"id": 8, "name": "Karameshi", "price": 41, "desc": "Arroz salteado picante con salsa tan tan y ajonjolí", "ingredients": [15, 69, 37, 23, 52, 25, 8, 33, 35, 63]},
  {"id": 9, "name": "Omuraisu", "price": 42, "desc": "Arroz envuelto en tortilla con salsa katsu y omuraisu", "ingredients": [69, 37, 46, 30, 29, 93, 84, 86, 62]}
];

// Cada receta lleva su área: así sobrevive a la sincronización JSON del modo cooperativo, y los ids
// (que se repiten entre catálogos) ya no chocan al comparar platos.
[[RECETAS_RAMEN, 'ramen'], [RECETAS_SALTEADOS, 'salteados'], [RECETAS_MAKIS, 'makis'], [RECETAS_FRITURAS, 'frituras']]
  .forEach(([lista, area]) => lista.forEach(r => { r.area = area; }));

function sameDish(a, b) {
  return !!a && !!b && (a.area || 'ramen') === (b.area || 'ramen') && a.name === b.name;
}

// Platos que los clientes pueden pedir, por área: [nombre, nivel de campaña, ronda Rash] desde los
// que entra al menú. Quedan fuera los que aún no se pueden preparar: Gyozas (al vapor, necesita la
// 2.ª hornilla con sartén) y Maki Furai (termina en Frituras).
const AREA_DISH_UNLOCKS = {
  salteados: [
    ['Yakimeshi', 5, 6], ['Chicken Teriyaki', 6, 6], ['Chaufa Shimaya', 6, 10], ['Yakitori', 7, 10],
    ['Yakiramen', 7, 18], ['Yasaitame', 8, 18], ['Batayaki Ramen', 8, 25], ['Karameshi', 8, 25], ['Omuraisu', 8, 25]
  ],
  makis: [
    ['Maki California', 9, 12], ['Maki Guacamole', 10, 12], ['Maki Acevichado', 10, 20], ['Maki Hotate', 11, 20],
    ['Maki Amazon', 11, 20], ['Maki Yama', 12, 30], ['Maki Nin Niku', 12, 30], ['Maki Digion', 12, 30]
  ],
  frituras: [
    ['Alitas Acevichadas', 13, 22], ['Kaarage', 13, 22], ['Alitas Digión', 14, 28], ['Tonkatsu', 14, 32], ['Chicken Katsu', 14, 32],
    ['Age Gyozas', 15, 35], ['Ebi Furai', 15, 35], ['Katsu Kare', 16, 32]
  ]
};
const AREA_CATALOGS = { salteados: RECETAS_SALTEADOS, makis: RECETAS_MAKIS, frituras: RECETAS_FRITURAS };
