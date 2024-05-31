import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../base/MachineBlockEntity";
import recipes from "../../../recipes/compressor"

function get_ingredients(container) {
	const ingredients = [null]
	for (let i=1; i<10; i++) {
		ingredients.push(container.getItem(i))
	} return ingredients
}

function compare_lists(list1, list2) {
	for (let i = 0; i < list1.length; i++) {
		if (list1[i] != list2[i]) return false
	} return true
}

function find_recipe(ingredients) {
	for (let [result, recipe] of recipes) {
		if (ingredients.length != recipe.length) continue
		if (!compare_lists(recipe, ingredients)) {
			continue
		} else return result
	} return undefined
}

export class Compressor extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        this.fuelTypes = new Set(["minecraft:coal", "minecraft:charcoal", "minecraft:coal_block"]);
        this.start();
    }

    start() {
        this.runId = system.runInterval(() => {
            if (!this.entity.isValid()) {
                system.clearRun(this.runId);
                return;
            }
            this.generateHeat();
        });
    }

    generateHeat() {
        const container = this.entity.getComponent('minecraft:inventory').container;
		const items = get_ingredients(container)
		const ingredients = [...items.map(i=> i?.typeId)].filter(i=> i).sort()
		const output = find_recipe(ingredients)
		const output_item = container.getItem(10)
		const has_space = !output_item || (output_item.typeId == output && output_item.amount < 64)
        const fuelItem = container.getItem(0);
		const isCoalBlock = fuelItem?.typeId === 'minecraft:coal_block';
        let burnTime = container.getItem(13) ? + container.getItem(13).getLore()[0] : 0
        let burnDuration = container.getItem(13) ? + container.getItem(13).getLore()[1] : 1
		let progress = container.getItem(13) ? + container.getItem(13).getLore()[2] : 0
		
        if ( this.fuelTypes.has(fuelItem?.typeId) && burnTime == 0 && output) {
			container.setItem(0, fuelItem.decrementStack())
			burnTime = isCoalBlock ? 16010 : 1610
			burnDuration = isCoalBlock ? 16010 : 1610
		}
		if (burnTime > 0) burnTime--
		
		if (burnTime > 0 && progress < 200 && output && has_space) progress++
		
		if ((burnTime == 0 || !has_space) && progress > 0) progress--
		
		if (!output && progress > 0) progress = 0
		
		if ([120, 160, 200].includes(progress)) world.playSound("random.anvil_land", this.entity.location)
			
		if (progress == 200) {
			progress = 0
			for (let i = 1; i<10; i++) {
				if (items[i]) container.setItem(i, items[i].decrementStack())
			}
			if (output_item?.typeId == output) {
				container.setItem(10, output_item.incrementStack())
			} else container.setItem(10, new ItemStack(output))
		}
		
		const counter = new ItemStack('clock') //Math.ceil((energy/ store_data.capacity) * 75 )
		counter.nameTag = `cosmos:§burn${Math.round((burnTime / burnDuration) * 13)}`
		container.setItem(11, counter)
		counter.nameTag = `cosmos:§prog${Math.ceil((progress / 200) * 52)}`
		container.setItem(12, counter)
		counter.nameTag = ``
		counter.setLore([''+burnTime, ''+burnDuration, ''+progress])
		container.setItem(13, counter)
    }
}

