import { system } from "@minecraft/server"
import { load_dynamic_object, save_dynamic_object } from "../../../api/utils"
import { charge_from_machine } from "../../matter/electricity"
import { input_fluid } from "../../matter/fluids"

const EnergyDisplay = 14, FluidDisplay = 15

const data = {
	energy: {input: "left", capacity: 16000, maxInput: 400},
	water: {input: "right", capacity: 2000},
	items: {
		// 14 real slots (0 to 13)
	},
	onTick(entity, block) {
		const container = entity.getComponent('minecraft:inventory').container
		const variables = load_dynamic_object(entity, "machine_data")
		let energy = variables.energy || 0
		let water = variables.water || 0

		// Input processing
		energy = charge_from_machine(entity, block, energy)
		water = input_fluid({type: "water", slot: "water"}, entity, block, water)

		// Basic energy consumption/tick logic
		if (energy >= 10 && water > 0) {
			energy -= 10
			if (system.currentTick % 20 === 0) {
				water = Math.max(0, water - 1)
			}
		} else {
			if(!(system.currentTick % 80)) energy -= Math.min(1, energy)
		}

		save_dynamic_object(entity, {energy, water}, "machine_data")

		// UI display sync
		if (system.currentTick % 3 == 0) {
			container.add_ui_display(EnergyDisplay, `Energy Storage\nA aEnergy: ${Math.round(energy)} gJ\nA cMax Energy: ${data.energy.capacity} gJ`, Math.ceil((energy / data.energy.capacity) * 55))
			container.add_ui_display(FluidDisplay, `Fluid Tank\nA eWater: ${Math.round(water)} mB / ${data.water.capacity} mB`, Math.ceil((water / data.water.capacity) * 38))
		}
	}
}; export default data
