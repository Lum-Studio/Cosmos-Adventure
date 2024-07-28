import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";
import { compare_lists, get_vars, get_data} from "../../../api/utils";
import recipes from "../../../recipes/compressor"
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";

function get_ingredients(container) {
	const ingredients = []
	for (let i = 0; i < 9; i++) {
		ingredients.push(container.getItem(i))
	} return ingredients
}


function find_recipe(ingredients) {
	for (let [result, recipe] of recipes) {
		if (ingredients.length != recipe.length) continue
		if (!compare_lists(recipe, ingredients)) {
			continue
		} else return result
	} return undefined
}
export class ElectricCompressor extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        this.start();
    }

    start() {
        this.runId = system.runInterval(() => {
            if (!this.entity.isValid()) {
                system.clearRun(this.runId);
                return;
            }
            this.compress();
        });
    }

    compress(){
		const container = this.entity.getComponent('minecraft:inventory').container;
		const data = get_data(this.entity);
        const vars_item = container.getItem(14)
        let energy = get_vars(vars_item, 0)
		let progress = get_vars(vars_item, 1)
		energy = charge_from_machine(this.entity, energy)
		energy = charge_from_battery(this.entity, energy, 5);
        energy = (energy>0)? energy - 0.0125:
		energy;
		const items = get_ingredients(container)
		const ingredients = [...items.map(i => i?.typeId)].filter(i => i).sort()
		const output = find_recipe(ingredients)
		const output_items = [container.getItem(9), container.getItem(10)];
		const one_has_space = (oneItemMax) => (!output_items[0] || (output_items[0].typeId == output && output_items[0].amount < oneItemMax))
		const two_has_space = (twoItemMax) => (!output_items[1] || (output_items[1].typeId == output && output_items[1].amount < twoItemMax))
        if (energy > 0 && progress < 200 && output && (one_has_space(64) || two_has_space(64))) progress = progress + 5

		if ((energy == 0 || (!one_has_space(64) && !two_has_space(64))) && progress > 0) progress = progress - 5
        if (progress == 200) {
			this.block.dimension.playSound("random.anvil_land", this.entity.location)
			progress = 0
			energy = energy - 2000
			if(items.every((element) => (element === undefined || element.amount == 1)) && (one_has_space(64) || two_has_space(64)) && (!one_has_space(63) && !two_has_space(63))){
			for (let i = 0; i < 9; i++){
				if (items[i]) container.setItem(i, items[i].decrementStack(1))
			}
		    if(one_has_space(64)){
				if(output_items[0]?.typeId == output) {
					container.setItem(9, output_items[0].incrementStack())
				} else container.setItem(9, new ItemStack(output))
			}
			else if(two_has_space(64) && !one_has_space(64)){
				if(output_items[1]?.typeId == output) {
					container.setItem(10, output_items[1].incrementStack())
				} else container.setItem(10, new ItemStack(output))
			}
			}
			else if(items.every((element) => (element === undefined || element.amount >= 2)) && (one_has_space(63) || two_has_space(63))){
				for (let i = 0; i < 9; i++){
					if (items[i]) container.setItem(i, items[i].decrementStack(2))
				}
				if(one_has_space(63) && two_has_space(63)){
					if(output_items[0]?.typeId == output) {
						container.setItem(9, output_items[0].incrementStack())
					} else container.setItem(9, new ItemStack(output))
					if(output_items[1]?.typeId == output) {
						container.setItem(10, output_items[1].incrementStack())
					} else container.setItem(10, new ItemStack(output))
				}
				else if(one_has_space(63) && !two_has_space(63)){
					if(output_items[0]?.typeId == output) {
						container.setItem(9, output_items[0].incrementStack(63, 2))
					} else container.setItem(9, new ItemStack(output, 2))
				}
				else if(!one_has_space(63) && two_has_space(63)){
					if(output_items[1]?.typeId == output) {
						container.setItem(10, output_items[1].incrementStack(63, 2))
					} else container.setItem(10, new ItemStack(output, 2))
				}
			}
		}
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§ener${Math.round((energy / data.capacity) * 55)}`
		container.setItem(11, counter)
		counter.nameTag = `cosmos:§prog${Math.ceil((progress / 200) * 52)}`
		container.setItem(12, counter)
		counter.nameTag = `cosmos:  Status:\n${!progress ? '    §6Idle' : '§aCompressing'}`
		container.setItem(13, counter)
		counter.nameTag = ``
		counter.setLore(['' +energy, '' +progress])
		container.setItem(14, counter)
    }
}