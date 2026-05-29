import { system, ItemStack } from "@minecraft/server";
import { compare_lists, load_dynamic_object, save_dynamic_object } from "../../../api/utils";
import { recipes } from "../../../recipes/deconstructor.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import { get_data } from "../Machine.js";

class Deconstructor {
	static energy = {input: "right", capacity: 16000, maxInput: 45};
	static items = {
		top_input: [1],
		side_input: [1],
		output: [2, 3, 4, 5, 6, 7, 8, 9, 10]
	};

	static onTick(entity, block){
		const container = entity.getComponent('minecraft:inventory').container;
		const variables = load_dynamic_object(entity, "machine_data");
		let energy = variables.energy || 0;
		let progress = variables.progress || 0;
		let first_values = [energy, progress];

		energy = charge_from_machine(entity, block, energy)
		energy = charge_from_battery(entity, energy, 0);
		if(!(system.currentTick % 80)) energy -= Math.min(1, energy)

		let recipe_item = container.getItem(1);
		if(recipe_item && energy >= 30){
			progress++;
			energy -= 30;

			if(progress >= 250){
				progress = 0;
				deconstruct(entity, recipe_item, container);
				container.setItem(1, recipe_item.decrementStack());
			}
		} else if (!recipe_item) {
			progress = 0;
		} else if (progress > 0) {
			progress = Math.max(progress - 1, 0);
		}

		if(!compare_lists(first_values, [energy, progress]) || !container.getItem(11)){
			save_dynamic_object(entity, {progress, energy}, "machine_data")
			const energy_hover = `Energy Storage\n§aEnergy: ${Math.round(energy)} gJ\n§cMax Energy: ${this.energy.capacity} gJ`
			container.add_ui_display(11, energy_hover, Math.round((energy / this.energy.capacity) * 55))
			container.add_ui_display(12, '', Math.ceil((progress / 250) * 24))
		}
	}
}
export default Deconstructor;
function deconstruct(storage, item, container){
	let recipe = recipes[item.typeId];
	if(!recipe) return;
	recipe = Object.entries(recipe);

	let current_item = {type: recipe[0][0], amount: recipe[0][1]};
	let offset = 0;
	for(let i = 0; i < 9;){
		i++;
		if(offset + 1 > recipe.length || !recipe[offset]) break;
		
		let slot = container.getItem(1 + i);

		if(!slot){
			container.setItem(1 + i, new ItemStack(current_item.type, current_item.amount));
			offset++;
			current_item = recipe[offset] ? {type: recipe[offset][0], amount: recipe[offset][1]}: undefined;
			continue;
		}else if(slot.typeId == current_item.type){
			let space = 64 - slot.amount;
			if(!space) continue;
			else if(space >= current_item.amount){
				container.setItem(1 + i, new ItemStack(current_item.type, current_item.amount + slot.amount));
				offset++;
				current_item = recipe[offset] ? {type: recipe[offset][0], amount: recipe[offset][1]}: undefined;
			    continue;
			}else{
				container.setItem(1 + i, new ItemStack(current_item.type, slot.amount + space));
				current_item.amount = current_item.amount - space;
			}
		}
	}
}