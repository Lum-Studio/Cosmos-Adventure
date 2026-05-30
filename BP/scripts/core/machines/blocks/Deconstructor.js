import { system, ItemStack } from "@minecraft/server";
import { compare_lists, load_dynamic_object, save_dynamic_object } from "../../../api/utils";
import { recipes } from "../../../recipes/galacticraft_crafting_recipes_data.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";

const SALVAGE_CHANCE = 0.75;
const PROCESS_TIME_REQUIRED = 250;
const BatterySlot = 0;
const InputSlot = 1;

// Only these items can be salvaged from the deconstructor (matching Java's salvageable list)
const salvageable = [
	"cosmos:heavy_duty_plate_tier3",    // T3 plate
	"cosmos:compressed_titanium",       // Compressed titanium
	"cosmos:titanium_ingot",            // Titanium ingot
	"cosmos:heavy_duty_plate_tier2",    // T2 plate
	"cosmos:compressed_desh",           // Compressed desh
	"cosmos:desh_ingot",                // Desh ingot
	"cosmos:steel_pole",                // Flag pole
	"cosmos:heavy_duty_plate",          // T1 heavy plating
	"cosmos:compressed_meteoric_iron",  // Compressed meteoric iron
	"cosmos:meteoric_iron_ingot",       // Meteoric iron ingot
	"cosmos:compressed_steel",          // Compressed steel
	"cosmos:compressed_bronze",         // Compressed bronze
	"cosmos:compressed_aluminum",       // Compressed aluminum
	"cosmos:compressed_copper",         // Compressed copper
	"cosmos:compressed_tin",            // Compressed tin
	"cosmos:compressed_iron",           // Compressed iron
	"cosmos:aluminum_ingot",
	"cosmos:tin_ingot",
	"minecraft:copper_ingot",
	"minecraft:iron_ingot",
	"minecraft:gold_ingot",
	"minecraft:gold_nugget",
	"minecraft:diamond",
];

function isSalvage(itemId) {
	return salvageable.includes(itemId);
}

// Recursively break down an item into salvageable components
function getSalvageable(itemIds, done, depth) {
	if (!itemIds || itemIds.length === 0) return null;
	if (depth > 10) return null;

	const ret = [];
	for (const entry of itemIds) {
		const itemId = entry.type;
		const amount = entry.amount;

		if (isSalvage(itemId)) {
			ret.push({ type: itemId, amount: amount });
		} else {
			// Try to break down further via recipe
			const recipe = recipes[itemId];
			if (recipe) {
				const ingredients = Object.entries(recipe).map(([type, amt]) => ({ type, amount: amt }));
				// Prevent recursive A->B->A chains
				const filtered = done ? ingredients.filter(i => i.type !== done) : ingredients;
				const recursive = getSalvageable(filtered, itemId, depth + 1);
				if (recursive && recursive.length > 0) {
					// Scale by amount of this item
					for (const r of recursive) {
						ret.push({ type: r.type, amount: r.amount * amount });
					}
				}
			}
		}
	}
	return ret;
}

// Combine duplicate item types
function squashList(items) {
	if (!items || items.length === 0) return null;
	const ret = [];
	for (const item of items) {
		const existing = ret.find(r => r.type === item.type);
		if (existing) {
			existing.amount += item.amount;
		} else {
			ret.push({ type: item.type, amount: item.amount });
		}
	}
	return ret;
}

// Each individual item has a 75% chance of being returned
function randomChanceList(items) {
	if (!items || items.length === 0) return null;
	const ret = [];
	for (const item of items) {
		let result = 0;
		for (let i = 0; i < item.amount; i++) {
			if (Math.random() < SALVAGE_CHANCE) result++;
		}
		if (result > 0) {
			ret.push({ type: item.type, amount: result });
		}
	}
	return ret;
}

function addToOutputMatrix(container, stack) {
	let remaining = stack.amount;
	for (let i = 2; i < 11; i++) {
		if (remaining <= 0) return;
		const slot = container.getItem(i);
		if (!slot) {
			container.setItem(i, new ItemStack(stack.type, remaining));
			return;
		}
		if (slot.typeId === stack.type) {
			const space = 64 - slot.amount;
			if (space <= 0) continue;
			const toAdd = Math.min(remaining, space);
			container.setItem(i, new ItemStack(stack.type, slot.amount + toAdd));
			remaining -= toAdd;
		}
	}
}

const data = {
	energy: { input: "right", capacity: 16000, maxInput: 45 },
	items: {
		top_input: [InputSlot],
		side_input: [InputSlot],
		output: [2, 3, 4, 5, 6, 7, 8, 9, 10]
	},
	onTick(entity, block) {
		const container = entity.getComponent('minecraft:inventory').container;
		const variables = load_dynamic_object(entity, "machine_data");
		let energy = variables.energy || 0;
		let progress = variables.progress || 0;
		let first_values = [energy, progress];

		energy = charge_from_machine(entity, block, energy);
		energy = charge_from_battery(entity, energy, BatterySlot);
		if (!(system.currentTick % 80)) energy -= Math.min(1, energy);

		if (energy > 0) {
			const recipe_item = container.getItem(InputSlot);
			if (recipe_item) {
				progress++;
				if (progress >= PROCESS_TIME_REQUIRED) {
					progress = 0;
					// Java-faithful deconstruction: recursive salvage + random chance
					const ingredients = [{ type: recipe_item.typeId, amount: 1 }];
					let salvaged = getSalvageable(ingredients, null, 0);
					salvaged = squashList(salvaged);
					salvaged = randomChanceList(salvaged);
					if (salvaged) {
						for (const output of salvaged) {
							addToOutputMatrix(container, output);
						}
					}
					container.setItem(InputSlot, recipe_item.decrementStack());
				}
			} else {
				progress = 0;
			}
		} else {
			progress = 0;
		}

		if (!compare_lists(first_values, [energy, progress]) || !container.getItem(11)) {
			save_dynamic_object(entity, { progress, energy }, "machine_data");
			const energy_hover = `Energy Storage\n§aEnergy: ${Math.round(energy)} gJ\n§cMax Energy: ${data.energy.capacity} gJ`;
			container.add_ui_display(11, energy_hover, Math.round((energy / data.energy.capacity) * 55));
			container.add_ui_display(12, '', Math.ceil((progress / PROCESS_TIME_REQUIRED) * 54));
		}
	}
};

export default data;