/* Módulo 29-secretos-datos — catálogo de los secretos del chef que se compran en la Tienda (taller.js).
   Antes tenía también la galería con fichas y modelos 3D; se quitaron: aquí quedan solo los datos de cada ítem.
   Script clásico (ámbito global compartido): se carga en el orden de los <script> de index.html. */

const CHEF_SECRETS = [
  { id: "ramen_shio", category: "ramen", name: "Shio Ramen", subtitle: "Ramen Cristalino Tradicional de Hakodate", icon: "🍜" },
  { id: "ramen_shoyu", category: "ramen", name: "Shoyu Ramen", subtitle: "El Clásico Legendario de Tokyo (Asakusa 1910)", icon: "🍜" },
  { id: "ramen_miso", category: "ramen", name: "Miso Ramen", subtitle: "La Fuerza Cálida del Norte (Sapporo, Hokkaido)", icon: "🍜" },
  { id: "ramen_tonkotsu", category: "ramen", name: "Tonkotsu Ramen", subtitle: "Emulsión de Médula & Colágeno de Hakata", icon: "🍜" },
  { id: "ramen_chashu", category: "ramen", name: "Chashu Ramen", subtitle: "Banquete Carnívoro de Panceta Braseada", icon: "🥩" },
  { id: "ramen_ebi", category: "ramen", name: "Ebi Ramen", subtitle: "Esencia Marina de Langostino Tostado", icon: "🦐" },
  { id: "ramen_tantan", category: "ramen", name: "Tan Tan Ramen", subtitle: "Fuego Aromático de Sésamo & Rayu", icon: "🌶️" },
  { id: "ramen_vegetariano", category: "ramen", name: "Ramen Vegetariano", subtitle: "Armonía Zen de la Cocina Monacal Budista", icon: "🥬" },
  { id: "ramen_bajiru", category: "ramen", name: "Bajiru Ramen", subtitle: "Vanguardia Italo-Japonesa de Albahaca", icon: "🌿" },
  { id: "tamago", category: "ingredientes", name: "Huevo Ajitsuke", subtitle: "Huevo Marinado Semi-Líquido Hanjuku", icon: "🥚" },
  { id: "chashu", category: "ingredientes", name: "Chashu Caramelizado", subtitle: "Panceta Braseada de Corteza Laqueada", icon: "🥓" },
  { id: "fideos", category: "ingredientes", name: "Fideos Kansui Artesanales", subtitle: "Masa Elástica de Trigo con Agua Alcalina", icon: "🥢" },
  { id: "caldo_tonkotsu", category: "ingredientes", name: "Caldo Tonkotsu Sagrado", subtitle: "Emulsión de Médula & Huesos de Fémur", icon: "🍲" },
  { id: "alga_nori", category: "ingredientes", name: "Alga Nori de Ariake", subtitle: "Lámina Marina Crocante Tostada al Fuego", icon: "🍙" },
  { id: "langostinos", category: "ingredientes", name: "Langostino Ebi Real", subtitle: "Langostino Escalfado de Cola Escarlata", icon: "🦐" },
  { id: "shitake", category: "ingredientes", name: "Hongo Shiitake Donko", subtitle: "El Tesoro Forestal de Máximo Umami", icon: "🍄" },
  { id: "tofu", category: "ingredientes", name: "Triángulos de Tofu Dorado", subtitle: "Aburaage Frito en Doble Temperatura", icon: "🧈" },
  { id: "cuchillo_santoku", category: "cuchillos", name: "Cuchillo Santoku", subtitle: "El Cuchillo de las Tres Virtudes (Carne, Pescado, Verdura)", icon: "🔪" },
  { id: "cuchillo_gyuto", category: "cuchillos", name: "Cuchillo Gyuto", subtitle: "La Espada del Chef Japonés", icon: "🗡️" },
  { id: "cuchillo_deba", category: "cuchillos", name: "Cuchillo Deba", subtitle: "Poder Pesado para Pescados & Mariscos", icon: "🔪" },
  { id: "cuchillo_nakiri", category: "cuchillos", name: "Cuchillo Nakiri", subtitle: "Maestro Rectangular de Vegetales", icon: "🔪" },
  { id: "cuchillo_yanagiba", category: "cuchillos", name: "Cuchillo Yanagiba", subtitle: "Hoja de Sauce para Cortes Finos como Seda", icon: "🗡️" },
  { id: "herramienta_benriner", category: "herramientas", name: "Benriner Turning Slicer", subtitle: "El Torno de las Láminas Continuas (Katsuramuki)", icon: "⚙️" }
];
