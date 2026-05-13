import { system } from "@minecraft/server";
import { load_dynamic_object, save_dynamic_object } from "../../../api/utils"
import { charge_from_battery, charge_from_machine } from "../../matter/electricity";
import { fluid_names, load_from_canister } from "../../matter/fluids";

const data = {
	energy: { input: "below", capacity: 16000, maxInput: 900 },
	gas: { input: "left", capacity: 4000 },
	liquid: { output: "right", capacity: 2000 },
	onTick(entity, block) {
		const container = entity.getComponent('minecraft:inventory').container
		const active = entity.getDynamicProperty('active')

		//loading variables
		const variables = load_dynamic_object(entity, "machine_data")
		let energy = variables.energy || 0
		let gas = variables.input_tank ?? {amount: 0}
		let liquid = variables.output_tank ?? {amount: 0}
		
		//managing energy
		energy = charge_from_machine(entity, block, energy)
		energy = charge_from_battery(entity, energy, 1)

		//manage fluids
		const input = container.getItem(0)
		if (input && input.typeId == "cosmos:o2_canister" && ["o2_gas", undefined].includes(gas.type)) {
			gas = { type: "o2_gas", amount: load_from_canister({
				item: input, ratio: 2,
				amount: gas.amount,
				capacity: data.gas.capacity,
				container, slot: 0
			})}
		}
		if (input && input.typeId == "cosmos:n2_canister" && ["n2_gas", undefined].includes(gas.type)) {
			gas = { type: "n2_gas", amount: load_from_canister({
				item: input, ratio: 2,
				amount: gas.amount,
				capacity: data.gas.capacity,
				container, slot: 0
			})}
		}
		if (input && input.typeId == "cosmos:methane_canister" && ["methane_gas", undefined].includes(gas.type)) {
			gas = { type: "methane_gas", amount: load_from_canister({
				item: input, ratio: 1,
				amount: gas.amount,
				capacity: data.gas.capacity,
				container, slot: 0
			})}
		}

		//makes snow particles that fall on the sides
		//oxygen gas into liquid oxygen
		//nitrogen gas into liquid nitrogen
		//methane into fuel
		//liquid nitrogen from overworld air
		//mars Co2 into liquid argon
		// venus has Co2(for MS) and Nitrogen(for GL)

		save_dynamic_object(entity, {energy, input_tank: gas, output_tank: liquid}, "machine_data")
		
		const status =
		energy == 0 ? "§cLow energy" : 
		gas.amount == 0 ? "§cNo gas" :
		liquid.amount == data.liquid.capacity ? "§cTanks full" :
		active ? "§6Ready" : 
		"§2Liquefying"

		// UI Display:
		// 0: Input slot
		// 1: Battery slot
		// 2: Output slot
		container.add_ui_display(3, `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.energy.capacity} gJ`, Math.ceil((energy / data.energy.capacity) * 55))
		container.add_ui_display(4, `Gas Storage\n(${fluid_names[gas.type]})\n§e${gas.amount} / ${data.gas.capacity}`, Math.ceil((gas.amount / data.gas.capacity) * 38))
		container.add_ui_display(5, `Liquid Tank\n(${fluid_names[liquid.type]})\n§e${liquid.amount} / ${data.liquid.capacity}`, Math.ceil((liquid.amount / data.liquid.capacity) * 38))
		container.add_ui_display(6, `§rStatus:\n ${status}`)
		container.add_ui_button (7, active ? 'Stop' : 'Process', entity, 'active', !active)
	}
}; export default data