/* reconocer-carta.js — La carta ampliada de Shimaya para el modo «Reconocer ingredientes» (solo para ese modo: no entra a la Campaña).
   58 platos en 5 grupos (Makis, Bowls, Entradas, Fondos, Alitas) tomados de ingredientes_de_platos.pdf (2026-10-28).
   Cada plato es una lista de ingredientes por NOMBRE; al cargar, cada nombre se enlaza con un ingrediente que ya existe en el juego (INGREDIENTES)
   o, si no existe, se crea uno solo para Reconocer (ids desde 301, con emoji hasta que haya arte). Script clásico. API: window.ReconCarta. */
(function () {
  'use strict';
  const GROUPS = [['cmakis', '🍣', 'Makis carta'], ['cbowls', '🥗', 'Bowls'], ['centradas', '🥟', 'Entradas'], ['cfondos', '🍛', 'Fondos'], ['calitas', '🍗', 'Alitas']];

  // [nombre del plato, grupo, 'ingredientes separados por coma']
  const DISHES = [
    // ---- Makis ----
    ['Base', 'cmakis', 'shari, nori, palta, queso crema, langostino'],
    ['Acevichado', 'cmakis', 'langostino, palta, shari, nori, cobertura de pescado, salsa acevichada, camote, togarashi'],
    ['Inka', 'cmakis', 'shari, nori, palta, queso crema, trucha ahumada, ajonjolí blanco, ajonjolí negro'],
    ['Kiro', 'cmakis', 'shari, nori, palta, cobertura de salmón, langostino, salsa kiro, togarashi, rulos de cebolla'],
    ['Sumoku', 'cmakis', 'shari, nori, palta, queso crema, trucha ahumada, panko tostado, salsa sumoku'],
    ['Spicy', 'cmakis', 'shari, nori, palta, cobertura de salmón, langostino, salsa spicy, togarashi, rulos de cebolla'],
    ['Keihaku', 'cmakis', 'shari, nori, atún, kiury, langostino, cobertura de atún, togarashi, salsa keihaku'],
    ['Amai', 'cmakis', 'shari, nori, palta, queso crema, atún crispi, cobertura de plátano, azúcar, cebolla china, salsa teriyaki'],
    ['Kuroi', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa kuroi, togarashi, rulos de cebolla'],
    ['Nin Niku', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa nin niku, togarashi'],
    ['Murazaki', 'cmakis', 'shari, nori, palta, langostino, cobertura de pulpo, salsa murazaki, ajonjolí negro, rulos de cebolla'],
    ['Yuwaku', 'cmakis', 'queso crema, pescado blanco, salmón, cebolla china, nori, shari, cobertura de plátano, salsa teriyaki'],
    ['Hotate', 'cmakis', 'shari, nori, palta, langostino, conchas de abanico, salsa hotate, togarashi, limón'],
    ['Vegetariano', 'cmakis', 'shari, nori, zanahoria, betarraga, kiury, salsa ponzu'],
    ['Amakarai', 'cmakis', 'shari, nori, palta, langostino, cobertura de salmón, salsa amakarai, ajonjolí blanco, ajonjolí negro, quinua pop, rulos de cebolla, sal dashi'],
    ['Jonetsu', 'cmakis', 'shari, nori, palta, langostino, cobertura de salmón, salsa jonetsu, ajonjolí negro, cebolla china, sal dashi, camote, limón'],
    ['Yama', 'cmakis', 'shari, nori, palta, langostino, tar tar yama, salsa yama, cebolla china, salsa teriyaki, togarashi'],
    ['Anticuchero', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa anticuchera, togarashi, poro frito, cebolla china, limón'],
    ['Avocado', 'cmakis', 'shari, nori, langostino, queso crema, cobertura de palta, salsa teriyaki, ajonjolí blanco'],
    ['Amairyu', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa amairyu, togarashi, rulos de cebolla'],
    ['Pachikay', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa pachikay, togarashi'],
    ['Paseri', 'cmakis', 'shari, nori, palta, langostino, cobertura de atún, salsa paseri, togarashi'],
    ['Sumokuchizu', 'cmakis', 'shari, nori, atún, palta, cebolla china, harina, huevo, panko, salsa sumokuchizu'],
    // ---- Bowls y especiales ----
    ['Hiyashi Chuka', 'cbowls', 'fideo ramen, salsa hiyashi chuka, tomate, huevo, chasu, kiury, ajonjolí blanco, ajonjolí negro, benishoga, rulos de cebolla'],
    ['Ceviche Nikkei', 'cbowls', 'atún, palta, puré de camote, cebolla morada, kiury, culantro, ajonjolí blanco, ají limo'],
    ['Poke de Salmón', 'cbowls', 'shari, salsa acevichada, furikake, quinua pop, atún crispi, cebolla blanca, col morada, palta, salmón, kiury, rabanito, benishoga, ajonjolí blanco, ajonjolí negro, salsa poke salmón'],
    ['Poke de Atún', 'cbowls', 'shari, salsa acevichada, furikake, quinua pop, atún crispi, cebolla blanca, col morada, palta, atún, kiury, rabanito, benishoga, ajonjolí blanco, ajonjolí negro, salsa nikkei'],
    ['Poke de Karage', 'cbowls', 'shari, salsa acevichada, furikake, quinua pop, cebolla blanca, col morada, palta, karage, kiury, rabanito, benishoga, ajonjolí blanco, ajonjolí negro, salsa poke salmón'],
    // ---- Entradas ----
    ['Misoshiru', 'centradas', 'tofu, salsa miso, caldo shio, cebolla china, wakame'],
    ['Gyozas', 'centradas', 'cerdo molido, langostino molido, col, ajo chino, pasta gyoza, salsa ponzu'],
    ['Age Gyozas', 'centradas', 'cerdo molido, langostino molido, col, ajo chino, pasta gyoza, salsa teriyaki'],
    ['Shake Tako', 'centradas', 'pasta gyoza frita, lechuga, guacamole, tar tar de salmón, salsa poke salmón, cebolla china, culantro, togarashi'],
    ['Karage', 'centradas', 'pollo karage, chuño, col, mayonesa, zanahoria, togarashi, cebolla china'],
    ['Ebi Furai', 'centradas', 'langostinos empanizados, col, mayonesa, zanahoria, togarashi, cebolla china, salsa teriyaki'],
    ['Ebi Delice', 'centradas', 'langostinos rellenos de queso, col, mayonesa, betarraga, togarashi, cebolla china, salsa teriyaki'],
    ['Kaen Gyoza', 'centradas', 'pasta gyoza, atún molido, cebolla blanca, salsa kaen, poro frito, ají limo, culantro, ajonjolí blanco'],
    ['Tar Tar de Atún', 'centradas', 'cracker de arroz, tar tar de atún, cebolla blanca, salsa ponzu, kiury, huevo ahumado, togarashi, rulos de cebolla, limón'],
    // ---- Fondos ----
    ['Karameshi', 'cfondos', 'arroz gohan, pollo cuadrado, col, holantao, moyashi, salsa tan tan, ajonjolí blanco, ajonjolí negro, cebolla china, ají limo, huevo, rulos de cebolla'],
    ['Udebi', 'cfondos', 'langostino, salsa udebi, fideo udon, culantro, limón, ají limo, rulos de cebolla'],
    ['Harusamen Iricha', 'cfondos', 'pollo tiras, fideo harusame, salsa harusamen, holantao, zanahoria, shitake, benishoga, betarraga, ajonjolí blanco, ajonjolí negro'],
    ['Ebidon', 'cfondos', 'langostino, cebolla caramelizada, salsa katsudon, benishoga, cebolla china, arroz gohan, nori laminado'],
    ['Kare Raisu', 'cfondos', 'arroz gohan, salsa kare, pollo cuadrado, cebolla caramelizada, papa, zanahoria, ajonjolí negro, rulos de cebolla, polvo kare'],
    ['Chicken Katsu Kare', 'cfondos', 'bife de pollo, arroz gohan, col, mayonesa, zanahoria, cebolla china, togarashi, salsa kare'],
    ['Katsudon', 'cfondos', 'bife de cerdo, cebolla caramelizada, salsa katsudon, benishoga, cebolla china, arroz gohan, nori laminado'],
    ['Oyakodon', 'cfondos', 'pollo cuadrado, cebolla caramelizada, salsa katsudon, benishoga, cebolla china, arroz gohan, nori laminado'],
    ['Gyudon', 'cfondos', 'arroz gohan, lomo laminado, cebolla caramelizada, huevo escalfado, cebolla china, togarashi, benishoga'],
    ['Gyupidon', 'cfondos', 'fideo udon, salsa gyupidon, cebolla caramelizada, shitake, wanji, culantro, nori laminado, pak choi, lomo laminado'],
    ['Yasaitame de Pollo', 'cfondos', 'pollo tiras, col, holantao, brócoli, cebolla roja, pimiento, zapallo italiano, salsa yasaitame, moyashi'],
    ['Kare Udon', 'cfondos', 'fideo udon, pollo tiras, salsa kare, cebolla caramelizada, zanahoria, polvo kare'],
    ['Mabodofu', 'cfondos', 'chancho molido, tofu, salsa mabodofu, ajo chino, rulos de cebolla, arroz gohan'],
    ['Kare Ramen', 'cfondos', 'fideo ramen, salsa kare, polvo kare, pollo tiras, zanahoria, pimienta cayena, benishoga, rulos de cebolla'],
    ['Okonomiyaki', 'cfondos', 'fideo ramen, pollo tiras, cebolla blanca, col, moyashi, wanji, huevo, mayonesa, katsuobushi, salsa okonomiyaki, nori laminado, benishoga'],
    // ---- Alitas ----
    ['Alitas Amakarai', 'calitas', 'alitas, salsa amakarai, ajonjolí blanco, ajonjolí negro, cebolla china'],
    ['Alitas Anticuchera', 'calitas', 'alitas, salsa anticuchera, togarashi, rulos de cebolla, ají limo'],
    ['Alitas BBQ', 'calitas', 'alitas, salsa bbq, ajonjolí blanco, cebolla china, ají limo'],
    ['Alitas Spicy', 'calitas', 'alitas, salsa spicy, ajonjolí negro, rulos de cebolla'],
    ['Alitas Teriyaki', 'calitas', 'alitas, salsa teriyaki, frutos secos, rulos de cebolla'],
    ['Alitas Jonetsu', 'calitas', 'alitas, salsa jonetsu, camote, ajonjolí negro, brotes de alfalfa']
  ];

  // nombre del PDF → id de un ingrediente que ya existe en el juego (los que se llaman igual se enlazan solos)
  const ALIAS = {
    'shari': 38, 'queso': 72, 'rulos de cebolla': 74, 'betarraga': 42, 'poro frito': 71, 'chasu': 11, 'cebolla blanca': 46, 'tofu': 16,
    'cerdo molido': 13, 'pasta gyoza': 66, 'guacamole': 81, 'pollo karage': 70, 'mayonesa': 62, 'langostinos empanizados': 60, 'pollo tiras': 105,
    'zapallo italiano': 95, 'wanji': 21, 'alitas': 36, 'brocoli': 45, 'limon': 102, 'puré de camote': 114, 'pure de camote': 114
  };
  const ALIAS_GROUP = { langostino: { cmakis: 54, cbowls: 54, _: 14 } };

  const EMOJI = [[/^salsa/, '🥫'], [/karage/, '🍗'], [/tar tar/, '🍣'], [/palta/, '🥑'], [/panko/, '🍞'], [/pulpo/, '🐙'], [/salm[oó]n|trucha|pescado|at[uú]n|katsuobushi/, '🐟'], [/pl[aá]tano/, '🍌'], [/az[uú]car/, '🍬'], [/tomate/, '🍅'], [/lechuga|pak choi|col morada/, '🥬'],
    [/cebolla/, '🧅'], [/quinua/, '🌾'], [/furikake|sal dashi|polvo/, '🧂'], [/rabanito/, '🔴'], [/wakame|alfalfa/, '🌿'], [/papa/, '🥔'], [/udon|harusame|fideo/, '🍜'],
    [/cayena/, '🌶️'], [/huevo/, '🥚'], [/cracker/, '🍘'], [/queso/, '🧀'], [/langostino/, '🦐'], [/frita/, '🥟'], [/lomo/, '🥩'], [/salsa/, '🥫']];
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const extra = [];                         // ingredientes que solo existen para Reconocer
  const byName = new Map();
  function resolveAll() {
    const exist = new Map();
    INGREDIENTES.forEach(i => { [i.display, i.short].filter(Boolean).forEach(n => { const k = norm(n); if (!exist.has(k)) exist.set(k, i.id); }); });
    let nextId = 301;
    const find = (name, grupo) => {
      const k = norm(name);
      if (ALIAS_GROUP[k]) return ALIAS_GROUP[k][grupo] || ALIAS_GROUP[k]._;
      if (ALIAS[k]) return ALIAS[k];
      if (exist.has(k)) return exist.get(k);
      if (byName.has(k)) return byName.get(k);
      const em = (EMOJI.find(e => e[0].test(k)) || [0, '🍽️'])[1], id = nextId++;
      extra.push({ id, name: cap(name.trim()), display: cap(name.trim()), cat: /^salsa/.test(k) ? 'salsas' : 'otros', icon: em, areas: ['carta'], carta: true });
      byName.set(k, id); return id;
    };
    return DISHES.map(d => ({ name: d[0], group: d[1], ids: [...new Set(d[2].split(',').map(x => x.trim()).filter(Boolean).map(n => find(n, d[1])))] }));
  }
  const dishes = resolveAll();

  window.ReconCarta = {
    groups: GROUPS, dishes, extra,
    /** Ingrediente creado solo para Reconocer (o undefined si es de los del juego). */
    ing: id => extra.find(i => i.id === id),
    /** Platos de un grupo (o de toda la carta con 'carta'). */
    pool: g => (g === 'carta' ? dishes : dishes.filter(d => d.group === g))
  };
})();
