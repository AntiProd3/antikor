// Skins (apparence du vaisseau du joueur), v1.2. Purement visuels : aucun effet sur la partie.
// src : 'base' (offert), 'shop' (achetable au labo), 'halloween' (box Halloween), 'daily' (box du 7e jour)
// col = couleur principale (null : la couleur du joueur), col2 = visière et détails, deco = ornement dessiné en plus

export const SKINS = {
  base: { name: 'Standard', src: 'base', col: null, col2: '#ffffff' },
  toxic: { name: 'Toxique', src: 'shop', price: 120, col: '#8dff5a', col2: '#e8ffd0' },
  magma: { name: 'Magma', src: 'shop', price: 150, col: '#ff6a2a', col2: '#ffd23e', deco: 'flame' },
  ice: { name: 'Glace', src: 'shop', price: 150, col: '#8fe8ff', col2: '#ffffff', deco: 'frost' },
  gold: { name: 'Or', src: 'shop', price: 250, col: '#ffd23e', col2: '#fff3b0', deco: 'shine' },
  void: { name: 'Néon noir', src: 'shop', price: 220, col: '#b46bff', col2: '#ff3d8b', fill: '#05020a' },
  prism: { name: 'Prisme', src: 'shop', price: 350, col: 'prism', col2: '#ffffff' },
  pumpkin: { name: 'Citrouille', src: 'halloween', col: '#ff8c1a', col2: '#ffd23e', deco: 'pumpkin', odds: 35 },
  ghost: { name: 'Fantôme', src: 'halloween', col: '#e8f4ff', col2: '#8fe8ff', deco: 'ghost', odds: 30 },
  bat: { name: 'Chauve-souris', src: 'halloween', col: '#9d4dff', col2: '#ff3d5a', deco: 'bat', odds: 25 },
  skull: { name: 'Squelette', src: 'halloween', col: '#f2f2e6', col2: '#ff3d5a', deco: 'skull', odds: 10 },
  loyal: { name: 'Fidèle', src: 'daily', col: '#62ff9a', col2: '#ffd23e', deco: 'crown' },
  aurora: { name: 'Aurore', src: 'daily', col: '#ff6ad5', col2: '#3ef2ff', deco: 'halo' },
};

// Box Halloween : une seule par joueur
export const HALLOWEEN = { name: 'Box Halloween', cost: 199, col: '#ff8c1a' };

// Box de skin du 7e jour : un skin du labo ou de fidélité pas encore possédé ; s'il n'y en a plus, des noyaux
export const SKIN_BOX = { name: 'Box de skin', col: '#62ff9a', fallbackCores: 150 };

export const SRC_LABEL = {
  base: 'Offert',
  shop: 'Labo',
  halloween: 'Box Halloween',
  daily: 'Cadeau du 7e jour',
};
