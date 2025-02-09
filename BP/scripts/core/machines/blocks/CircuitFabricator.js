import { system, ItemStack } from "@minecraft/server";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import recipes from "../../../recipes/circuit_fabricator.js"
import { get_data, get_vars, compare_lists } from "../../../api/utils.js";


export default class {
    constructor(entity, block) {
		this.entity = entity;
		this.block = block;
        if (entity.isValid()) this.fabricate()
    }
    onPlace(){
		const container = this.entity.getComponent('minecraft:inventory').container
		const data = get_data(this.entity);
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§energy${Math.round((0 / data.capacity) * 55)}`
		container.setItem(7, counter)
		counter.nameTag = `cosmos:§prog${Math.round((0 / 300) * 51)}`
		container.setItem(8, counter)
		counter.nameTag = `Energy Storage\n§aEnergy: ${0} gJ\n§cMax Energy: ${data.capacity} gJ`
		container.setItem(9, counter)
		counter.nameTag = `Progress: ${Math.round((0 / 300) * 100)}%`
		container.setItem(10, counter)
		counter.nameTag = `cosmos:§stat${!0 ? '§4No Power' : 0 ? '§aRunning' : '§6Idle'}`
		container.setItem(11, counter)
	}
    fabricate() {
        const container = this.entity.getComponent('minecraft:inventory').container
		const data = get_data(this.entity)
		const materials = [0, 1, 2, 3].map(i=> container.getItem(i))
		const [raw_item, output_item] = [4,6].map(i=> container.getItem(i))
		const result = recipes.get(raw_item?.typeId)
		const has_space = !output_item || (result && output_item.typeId == result[0] && result[1] + output_item.amount <= 64)
		const is_loaded = compare_lists(materials.map(i=> i?.typeId), [
			"minecraft:diamond",
			"cosmos:raw_silicon",
			"cosmos:raw_silicon",
			"minecraft:redstone"
		])
		let energy = this.entity.getDynamicProperty("cosmos_energy");
		energy = (!energy)? 0:
		energy;
		let progress = this.entity.getDynamicProperty("cosmos_progress");
		progress = (!progress)? 0:
		progress;
		let first_energy = energy;
		let first_progress = progress;
		
	    energy = charge_from_machine(this.entity, this.block, energy)
		
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
			} else container.setItem(6, new ItemStack(result[0], result[1]));
			// world.playSound was deprecated
			this.block.dimension.playSound("random.anvil_land", this.entity.location)
		}
		const counter = new ItemStack('cosmos:ui')
		if(progress !== first_progress || energy !== first_energy){
			counter.nameTag = `cosmos:§stat${!energy ? '§4No Power' : progress ? '§aRunning' : '§6Idle'}`
			container.setItem(11, counter)
		}

		if(energy !== first_energy){
			this.entity.setDynamicProperty("cosmos_energy", energy);
			counter.nameTag = `cosmos:§energy${Math.round((energy / data.capacity) * 55)}`
			container.setItem(7, counter)
			counter.nameTag = `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.capacity} gJ`
			container.setItem(9, counter)
		}
		if(progress !== first_progress){
			this.entity.setDynamicProperty("cosmos_progress", progress);
			counter.nameTag = `cosmos:§prog${Math.round((progress / 300) * 51)}`
			container.setItem(8, counter)
			counter.nameTag = `Progress: ${Math.round((progress / 300) * 100)}%`
			container.setItem(10, counter)
		}
	}
}

