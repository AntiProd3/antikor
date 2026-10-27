// Progression du compte connecté, lue avec les règles partagées (js/rules.js) : talents, armes possédées.

import { prog } from './online/client.js';
import * as rules from './rules.js';

// prix d'un talent pour ce compte (il dépend du niveau de mutation)
export function talentCost(t, l) {
  return rules.talentCost(t, l, rules.mutationLevel(prog));
}

export function T(id) {
  return rules.talentLevel(prog, id);
}

// Arsenal : le niveau n s'achète une fois le monde n atteint en carrière (0 = pas de restriction)
export function talentGate(t, l) {
  return rules.talentGate(t, l, prog.career.max);
}

export function ownedMap() {
  return rules.ownedMap(prog.inv);
}

export function equipped() {
  return rules.equippedItem(prog);
}
