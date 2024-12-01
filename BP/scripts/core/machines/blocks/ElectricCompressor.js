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
        const vars_item = container.getItem(16)
        let energy = get_vars(vars_item, 0)
		let progress = get_vars(vars_item, 1)
		let timer = get_vars(vars_item, 2)
		timer = (timer < 80)? timer + 1:
		0;
		energy = charge_from_machine(this.entity, this.block, energy)
		energy = charge_from_battery(this.entity, energy, 11);
        if(timer === 0) energy -= Math.min(1, energy)
		const items = get_ingredients(container)
		const ingredients = [...items.map(i => i?.typeId)].filter(i => i).sort()
		const output = find_recipe(ingredients)
		const output_items = [container.getItem(9), container.getItem(10)];
		const one_has_space = (oneItemMax) => (!output_items[0] || (output_items[0].typeId == output && ((oneItemMax === 64)? output_items[0].amount < oneItemMax: output_items[0].amount <= oneItemMax)))
		const two_has_space = (twoItemMax) => (!output_items[1] || (output_items[1].typeId == output && ((twoItemMax === 64)? output_items[1].amount < twoItemMax: output_items[1].amount <= twoItemMax)))
        if (energy > 0 && progress < 200 && output && (one_has_space(64) || two_has_space(64))) {
		progress = progress + 5;
		energy -= Math.min(50, energy);
	}

		if ((energy == 0 || (output === undefined || (!one_has_space(64) && !two_has_space(64)))) && progress > 0) progress = progress - 5
        if (progress == 200) {
			this.block.dimension.playSound("random.anvil_land", this.entity.location)
			progress = 0
			let itemsWithout = items.filter((itemWithout) => itemWithout != undefined)
			let min = itemsWithout[0].amount;
			for (const item of itemsWithout) {
				if(item.amount < min){
					min = item.amount;
				}
			}
			if((min < 2) && (one_has_space(64) || two_has_space(64))){
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
			else if((min >= 2) && (one_has_space(63) || two_has_space(63))){
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
		container.setItem(12, counter)
		counter.nameTag = `cosmos:§prog${Math.ceil((progress / 200) * 52)}`
		container.setItem(13, counter)
		counter.nameTag = `cosmos:  Status:\n${!progress ? '    §6Idle' : '§aCompressing'}`
		container.setItem(14, counter)
		counter.nameTag = `Energy Storage\n§aEnergy: ${Math.round(energy)} gJ\n§cMax Energy: ${data.capacity} gJ`
		container.setItem(15, counter)
		counter.nameTag = ``
		counter.setLore(['' +energy, '' +progress, '' +timer])
		container.setItem(16, counter)
    }
}