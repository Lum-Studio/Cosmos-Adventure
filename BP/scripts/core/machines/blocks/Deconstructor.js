import { system, ItemStack } from "@minecraft/server";
import { load_dynamic_object, save_dynamic_object} from "../../../api/utils";
import { recipes } from "../../../recipes/deconstructor.js"
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import { get_data } from "../Machine.js";

export default function(entity, block) {
	const container = entity.getComponent('minecraft:inventory').container;
	const data = get_data(entity);
	const variables = load_dynamic_object(entity, "machine_data");
	let energy = variables.energy || 0;
	let progress = variables.progress || 0;

	energy = charge_from_machine(entity, block, energy)
	energy = charge_from_battery(entity, energy, 0);
	if(!(system.currentTick % 80)) energy -= Math.min(1, energy)

	if(energy > 0){
		let recipe_item = container.getItem(1);
		if(recipe_item){
			progress++;
		}else progress = 0;

		if(progress > 250){
			progress = 0;
			deconstruct(entity, recipe_item, container);
			container.setItem(1, recipe_item.decrementStack());
		}
	}

	save_dynamic_object(entity, {progress, energy}, "machine_data")
}

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