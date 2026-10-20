import {
  type Wizard,
  type Spell,
  type AcademyEvent,
  type House,
  type HousePoints,
  type SpellCategory,
  type SpellOutput,
  type ArrayElement,
  type WizardSummary,
  type WizardUpdate,
  type AttackSpell,
  type NonHealingCategory,
  type NewWizard,
  type SpellCastEvent,
} from "./types";

import { WizardRepository, SpellRepository } from "./repository";
import { Log, Cache } from "./decorators";

// ============================================================================
// Exercice 6 — Renforcer le Type Guard (Slides 11, 12, 13)
// ============================================================================
const validHouses: readonly House[] = [
  "Gryffindor",
  "Slytherin",
  "Ravenclaw",
  "Hufflepuff"
];

function isHouse(value: unknown): value is House {
  return (
    typeof value === "string" &&
    validHouses.some(house => house === value)
  );
}

// Type guard: safely narrow unknown data to a Wizard
function isWizard(value: unknown): value is Wizard {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    isHouse(candidate.house) &&
    typeof candidate.level === "number" &&
    typeof candidate.active === "boolean"
  );
}

// ============================================================================
// Exercice 3 — Gestionnaire d'événements avec Extract (Slide 5)
// ============================================================================
function handleSpellCast(event: SpellCastEvent): void {
  console.log(`Wizard ${event.wizardId} cast ${event.spellName}`);
}

// ============================================================================
// Exercice 5 — Service avec décorateur de mise en cache @Cache (Slide 10)
// ============================================================================
class SpellCalculator {
  @Cache
  calculatePower(basePower: number, multiplier: number): number {
    console.log("Calculating...");
    return basePower * multiplier;
  }
}

// ============================================================================
// Academy Service
// ============================================================================
class AcademyService {
  constructor(
    private readonly wizards: WizardRepository,
    private readonly spells: SpellRepository
  ) {}

  @Log
  castSpell(wizardId: number, spellId: number): string {
    const wizard = this.wizards.findById(wizardId);
    const spell = this.spells.findById(spellId);

    if (!wizard || !spell) {
      throw new Error("Wizard or spell not found");
    }

    return `${wizard.name} casts ${spell.name}!`;
  }

  findByHouse(house: House): WizardSummary[] {
    return this.wizards
      .getAll()
      .filter(wizard => wizard.house === house)
      .map(({ id, name, house }) => ({ id, name, house }));
  }

  updateWizard(id: number, changes: WizardUpdate): boolean {
    return this.wizards.update(id, changes);
  }

  getSpellEvents(events: AcademyEvent[]): Extract<AcademyEvent, { type: "spell-cast" }>[] {
    return events.filter(
      (event): event is Extract<AcademyEvent, { type: "spell-cast" }> =>
        event.type === "spell-cast"
    );
  }
}

// ============================================================================
// Execution / Tests
// ============================================================================

const wizards = new WizardRepository();
const spells = new SpellRepository();

// Données initiales
wizards.add({
  id: 1,
  name: "Harry Potter",
  house: "Gryffindor",
  level: 5,
  active: true,
  patronus: "Stag"
});

wizards.add({
  id: 2,
  name: "Hermione Granger",
  house: "Gryffindor",
  level: 8,
  active: true
});

wizards.add({
  id: 3,
  name: "Draco Malfoy",
  house: "Slytherin",
  level: 6,
  active: true
});

// --- Exercice 1: Ajouter un nouvel sorcier (Omit<Wizard, "id">) ---
console.log("\n==============================================");
console.log("--- Exercice 1 : Ajouter un sorcier avec NewWizard ---");
const newRon: NewWizard = {
  name: "Ron Weasley",
  house: "Gryffindor",
  level: 5,
  active: true,
  patronus: "Jack Russell Terrier"
};
const registeredRon = wizards.addWizard(newRon);
console.log("Nouveau sorcier enregistré (ID généré automatiquement) :", registeredRon);

// --- Exercice 2: Filtrer par maison (WizardRepository.findByHouse) ---
console.log("\n==============================================");
console.log("--- Exercice 2 : Filtrer les sorciers par maison ---");
const gryffindors = wizards.findByHouse("Gryffindor");
console.log("Sorciers de Gryffindor :", gryffindors);

// --- Exercice 3: Événement de sort avec Extract ---
console.log("\n==============================================");
console.log("--- Exercice 3 : Gestionnaire SpellCastEvent (Extract) ---");
handleSpellCast({
  type: "spell-cast",
  wizardId: 1,
  spellName: "Expelliarmus"
});

// --- Exercice 4: Validation de la puissance d'un sort (@ValidateSpellPower) ---
console.log("\n==============================================");
console.log("--- Exercice 4 : Décorateur ValidateSpellPower ---");
spells.add({
  id: 101,
  name: "Expelliarmus",
  category: "attack",
  power: 80
});

spells.add({
  id: 102,
  name: "Protego",
  category: "defense",
  power: 50
});

try {
  console.log("Tentative d'ajout d'un sort avec puissance négative (-10)...");
  spells.add({
    id: 103,
    name: "Invalid Spell",
    category: "attack",
    power: -10
  });
} catch (error) {
  if (error instanceof Error) {
    console.log(`[ATTENDU] Rejeté avec succès : ${error.message}`);
  }
}

// --- Exercice 5: Décorateur de mise en cache (@Cache) ---
console.log("\n==============================================");
console.log("--- Exercice 5 : Décorateur Cache ---");
const calculator = new SpellCalculator();
console.log("1er appel (10, 3) :");
console.log("Résultat :", calculator.calculatePower(10, 3));

console.log("2ème appel (10, 3) [doit être en cache] :");
console.log("Résultat :", calculator.calculatePower(10, 3));

console.log("3ème appel (5, 2) [nouveaux arguments] :");
console.log("Résultat :", calculator.calculatePower(5, 2));

// --- Exercice 6: Type Guard renforcé ---
console.log("\n==============================================");
console.log("--- Exercice 6 : Test Type Guard isWizard ---");
const validData: unknown = {
  id: 1,
  name: "Harry Potter",
  house: "Gryffindor",
  level: 5,
  active: true
};

const invalidData: unknown = {
  id: 2,
  name: "Viktor",
  house: "Durmstrang",
  level: 5,
  active: true
};

console.log("validData est un Wizard valide ?", isWizard(validData));     // true
console.log("invalidData est un Wizard valide ?", isWizard(invalidData)); // false (Durmstrang n'est pas autorisé)

// --- AcademyService & fonctionnalités existantes ---
console.log("\n==============================================");
console.log("--- AcademyService Tests ---");
const academy = new AcademyService(wizards, spells);
console.log(academy.castSpell(1, 101));

academy.updateWizard(1, { level: 6 });
console.log("Harry Potter après update :", wizards.findById(1));

const points: HousePoints = {
  Gryffindor: 100,
  Slytherin: 80,
  Ravenclaw: 90,
  Hufflepuff: 70
};
console.log("House points :", points);

const events: AcademyEvent[] = [
  { type: "spell-cast", wizardId: 1, spellName: "Lumos" },
  { type: "level-up", wizardId: 2, newLevel: 9 },
  { type: "wizard-expelled", wizardId: 3 }
];
console.log("Spell events filtrés :", academy.getSpellEvents(events));

// Compile-time checks
type CastArguments = Parameters<AcademyService["castSpell"]>;
type CastResult = ReturnType<AcademyService["castSpell"]>;
type AttackOutput = SpellOutput<"attack">;
type HealingOutput = SpellOutput<"healing">;
type SpellItem = ArrayElement<Spell[]>;
type AttackSpellExample = AttackSpell;
type RemainingCategories = NonHealingCategory;
type CategoryExample = SpellCategory;

const typeExamples: [
  CastArguments,
  CastResult,
  AttackOutput,
  HealingOutput,
  SpellItem,
  AttackSpellExample["category"],
  RemainingCategories,
  CategoryExample
] | null = null;

void typeExamples;
