// Raretés des armes et box.

// Bonus appliqués à l'arme pendant toute la partie (dégâts, recharge, zone, projectiles, niveau de départ).
// v1.1 : bonus plus modestes ; Légendaire et Mythique commencent toujours niveau 2.
export const RARITY = [
  { name: 'Commun', col: '#a9b6cc', dmg: 1, cd: 1, area: 1, proj: 0, lvl: 1 },
  { name: 'Rare', col: '#3ea8ff', dmg: 1.08, cd: 0.97, area: 1.02, proj: 0, lvl: 1 },
  { name: 'Épique', col: '#b46bff', dmg: 1.16, cd: 0.94, area: 1.04, proj: 0, lvl: 1 },
  { name: 'Légendaire', col: '#ffd23e', dmg: 1.25, cd: 0.91, area: 1.06, proj: 0, lvl: 2 },
  { name: 'Mythique', col: '#ff3d8b', dmg: 1.35, cd: 0.88, area: 1.08, proj: 1, lvl: 2 },
];

export function rarBonus(r) {
  const R = RARITY[r];
  const b = [];
  if (R.dmg > 1) b.push(`+${Math.round((R.dmg - 1) * 100)}% dégâts`);
  if (R.cd < 1) b.push(`-${Math.round((1 - R.cd) * 100)}% recharge`);
  if (R.area > 1) b.push(`+${Math.round((R.area - 1) * 100)}% zone`);
  if (R.proj) b.push(`+${R.proj} projectile`);
  if (R.lvl > 1) b.push(`commence niv ${R.lvl}`);
  return b.length ? b.join(' · ') : 'Statistiques de base';
}

// Cadeau de connexion (v1.2) : un par jour, 7 jours de suite ; un jour manqué fait repartir au jour 1,
// et après le 7e jour on recommence au jour 1
export const DAILY = [
  { cores: 20 },
  { cores: 30 },
  { box: 'std' },
  { cores: 50 },
  { box: 'std' },
  { box: 'prem' },
  { skinBox: true },
];

export const BOXES = {
  // la Box Souche ne donne jamais de Mythique (v1.1)
  std: { name: 'Box Souche', cost: 80, col: '#3ef2ff', odds: [60, 28, 9, 3, 0] },
  prem: { name: 'Box Mutante', cost: 140, col: '#ff3d8b', odds: [0, 55, 30, 12, 3] },
};
