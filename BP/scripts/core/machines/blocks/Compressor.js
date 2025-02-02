import { system, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";
import recipes from "../../../recipes/compressor"
import { compare_lists, get_vars } from "../../../api/utils";

const fuelTypes = new Set(["minecraft:coal", "minecraft:charcoal", "minecraft:coal_block"])

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

export default class extends MachineBlockEntity {
	constructor(block, entity) {
		super(block, entity);
        if (this.entity.isValid()) this.generateHeat()
	}
    onPlace(){
		const container = this.entity.getComponent('minecraft:inventory').container
		const data = get_data(this.entity);
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§burn${Math.round((0 / 1) * 13)}`
		container.setItem(11, counter)
		counter.nameTag = `cosmos:§prog${Math.ceil((0 / 200) * 52)}`
		container.setItem(12, counter)
		counter.nameTag = `cosmos:  Status:\n${!0 ? '    §6Idle' : '§aCompressing'}`
		container.setItem(13, counter)
	}
	generateHeat() {
		const container = this.entity.getComponent('minecraft:inventory').container;
		const items = get_ingredients(container)
		const ingredients = [...items.map(i => i?.typeId)].filter(i => i).sort()
		const output = find_recipe(ingredients)
		const output_item = container.getItem(10)
		const has_space = !output_item || (output_item.typeId == output && output_item.amount < 64)
		const fuelItem = container.getItem(9);
		const isCoalBlock = fuelItem?.typeId === 'minecraft:coal_block';
		let burnTime = this.entity.getDynamicProperty("cosmos_burnTime");
		burnTime = (!burnTime)? 0:
		burnTime;

		let burnDuration = this.entity.getDynamicProperty("cosmos_burnDuration");
		burnDuration = (!burnDuration)? 1:
		burnDuration;
		
		let progress = this.entity.getDynamicProperty("cosmos_progress");
		progress = (!progress)? 0:
		progress;

		let first_burnTime = burnTime;
		let first_burnDuration = burnDuration;

		if (fuelTypes.has(fuelItem?.typeId) && burnTime == 0 && output) {
			container.setItem(9, fuelItem.decrementStack())
			burnTime = isCoalBlock ? 16010 : 1610
			burnDuration = isCoalBlock ? 16010 : 1610
		}
		if (burnTime > 0) burnTime--

		if (burnTime > 0 && progress < 200 && output && has_space) progress++

		if ((burnTime == 0 || !has_space) && progress > 0) progress--

		if (!output && progress > 0) progress = 0

		if ([120, 160, 200].includes(progress)) this.block.dimension.playSound("random.anvil_land", this.entity.location)

		if (progress == 200) {
			progress = 0
			for (let i = 0; i < 9; i++) {
				if (items[i]) container.setItem(i, items[i].decrementStack())
			}
			if (output_item?.typeId == output) {
				container.setItem(10, output_item.incrementStack())
			} else container.setItem(10, new ItemStack(output))
		}

		const counter = new ItemStack('cosmos:ui')
		if(burnTime !== first_burnTime || burnDuration !== first_burnDuration){
			counter.nameTag = `cosmos:§burn${Math.round((burnTime / burnDuration) * 13)}`
			container.setItem(11, counter)
		}

		if(burnTime !== first_burnTime) this.entity.setDynamicProperty("cosmos_burnTime", burnTime);
		if(burnDuration != first_burnDuration){
			this.entity.setDynamicProperty("cosmos_burnDuration", burnDuration);
			counter.nameTag = `cosmos:§prog${Math.ceil((progress / 200) * 52)}`
			container.setItem(12, counter)
		}

	}
}

