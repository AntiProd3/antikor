// Talents permanents du labo, avec leurs textes d’infobulle.

export const TALENTS = [
  {
    id: 'slot',
    icon: 'arsenal',
    col: '#3ef2ff',
    name: 'Arsenal',
    desc: '+1 emplacement d’arme en partie',
    max: 2, // 3 armes au maximum (v1.1)
    costs: [120, 260],
  },
  { id: 'hp', icon: 'heart', col: '#ff4a6b', name: 'Vitalité', desc: '+10 PV max', max: 5, cost: 10 },
  { id: 'dmg', icon: 'powder', col: '#ffb03e', name: 'Puissance', desc: '+5% de dégâts', max: 5, cost: 14 },
  { id: 'spd', icon: 'boots', col: '#3ef2ff', name: 'Agilité', desc: '+4% de vitesse', max: 4, cost: 10 },
  { id: 'mag', icon: 'magnet', col: '#3ea8ff', name: 'Magnétisme', desc: '+15% de rayon de collecte', max: 3, cost: 8 },
  {
    id: 'gold',
    icon: 'gold',
    col: '#ffd23e',
    name: 'Fortune',
    desc: '+10% de pièces ramassées en partie',
    max: 5,
    cost: 10,
  },
  {
    id: 'start',
    icon: 'wallet',
    col: '#ffd23e',
    name: 'Capital',
    desc: '+20 pièces au début de chaque partie',
    max: 4,
    cost: 8,
  },
  { id: 'armor', icon: 'armor', col: '#9fb6ff', name: 'Blindage', desc: '-4% de dégâts subis', max: 3, cost: 16 },
  {
    id: 'reroll',
    icon: 'reroll',
    col: '#62ff9a',
    name: 'Relance',
    desc: '+1 relance gratuite par boutique',
    max: 2,
    cost: 28,
  },
  {
    id: 'choice',
    icon: 'cards',
    col: '#b46bff',
    name: 'Quatrième carte',
    desc: '4 choix à chaque niveau',
    max: 1,
    cost: 90,
  },
  {
    id: 'revive',
    icon: 'revive',
    col: '#62ff9a',
    name: 'Seconde chance',
    desc: 'Revient une fois à 50% PV',
    max: 1,
    cost: 120,
  },
];

export const TFX = {
  slot: l => `${1 + l} arme${l ? 's' : ''} en même temps`,
  hp: l => `+${10 * l} PV max`,
  dmg: l => `+${5 * l}% de dégâts`,
  spd: l => `+${4 * l}% de vitesse`,
  mag: l => `+${15 * l}% de rayon de collecte`,
  gold: l => `+${10 * l}% de pièces ramassées`,
  start: l => `+${20 * l} pièces au départ`,
  armor: l => `-${4 * l}% de dégâts subis`,
  reroll: l => `${l} relance${l > 1 ? 's' : ''} gratuite${l > 1 ? 's' : ''} par boutique`,
  choice: l => `${3 + l} cartes à chaque niveau`,
  revive: l => (l ? '1 résurrection à 50% PV par partie' : 'Aucune résurrection'),
};

export const TNOTE = {
  slot: 'Au départ tu n’as que l’arme équipée. Les emplacements en plus se remplissent avec les armes trouvées en partie (cartes de niveau et boutique), parmi celles de ton inventaire. Le niveau 1 se débloque au monde 2 de la carrière (2 armes), le niveau 2 au monde 3 (3 armes, le maximum).',
  hp: 'Points de vie de départ. Les PV remontent un peu entre les vagues.',
  dmg: 'S’applique à toutes tes armes.',
  spd: 'Vitesse de déplacement de ta cellule.',
  mag: 'Distance à laquelle les gemmes d’XP et les pièces viennent toutes seules à toi.',
  gold: 'Les pièces servent uniquement dans la boutique entre les vagues et disparaissent à la fin de la partie.',
  start:
    'Pratique pour acheter une amélioration dès la première boutique. Les pièces ne se gardent pas d’une partie à l’autre.',
  armor: 'Réduit les dégâts de contact et des projectiles ennemis.',
  reroll: 'Relancer remplace les offres de la boutique (les offres verrouillées sont gardées).',
  choice: 'Une carte de plus à choisir à chaque montée de niveau.',
  revive:
    'Quand tes PV tombent à zéro, tu reviens une fois avec la moitié de tes PV et une onde qui repousse les ennemis.',
};
