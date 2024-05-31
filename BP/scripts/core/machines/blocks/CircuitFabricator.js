import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../base/MachineBlockEntity";
import { compare_lists } from "./Compressor.js";
import { charge_from_battery, charge_from_machine } from "../../energy/electricity.js";
import recipes from "../../../recipes/circuit_fabricator.js"
import AllMachineBlocks from "../../machines/AllMachineBlocks"
function get_data(machine) {return AllMachineBlocks[machine.typeId.replace('cosmos:machine:', '')]}

export class CircuitFabricator extends MachineBlockEntity {
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
            this.fabricate();
        });
    }

    fabricate() {
        const container = this.entity.getComponent('minecraft:inventory').container;
		const data = get_data(this.entity)
		const materials = [0, 1, 2, 3].map(i=> container.getItem(i))
		const [raw_item, output_item] = [4,6].map(i=> container.getItem(i))
		const result = recipes.get(raw_item?.typeId)
		const has_space = !output_item || (result && output_item.typeId == result[0] && result[1] + output_item.amount <= 64)
        let energy = container.getItem(12) ? + container.getItem(12).getLore()[0] : 0
		let progress = container.getItem(12) ? + container.getItem(12).getLore()[1] : 0
		const is_loaded = compare_lists(materials.map(i=> i?.typeId), [
			"minecraft:diamond",
			"cosmos:raw_silicon",
			"cosmos:raw_silicon",
			"minecraft:redstone"
		])
		energy = charge_from_machine(this.entity, energy)
		
		energy = charge_from_battery(this.entity, energy, 5)
		
		if (is_loaded && result && has_space && energy > 0 && progress < 300) {
			progress++
			energy -= Math.min(20, energy)
		}
		
		if ((!has_space || energy == 0) && progress > 0) progress--
		
		if (!is_loaded || !result) progress = 0
		
		if (progress == 300) {
			progress = 0
			container.setItem(4, raw_item.decrementStack())
			for (let i=0; i<4; i++) {
				container.setItem(i, materials[i].decrementStack())
			}
			if (output_item?.typeId == result[0]) {
				output_item.amount += result[1]
				container.setItem(6, output_item)
			} else container.setItem(6, new ItemStack(result[0], result[1]))
		}
		
		const counter = new ItemStack('clock')
		container.setItem(7, counter)
		container.setItem(8, counter)
		container.setItem(9, counter)
		container.setItem(10, counter)
		container.setItem(11, counter)
		counter.nameTag = ``
		counter.setLore([''+energy, ''+progress])
		container.setItem(12, counter)
	}
}

