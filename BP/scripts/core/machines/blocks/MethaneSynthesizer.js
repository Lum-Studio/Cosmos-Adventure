import { system } from "@minecraft/server"
import { load_dynamic_object, save_dynamic_object } from "../../../api/utils"
import { charge_from_machine, charge_from_battery } from "../../matter/electricity"
import { machine_buttons, setup_ui_button } from "../MachineButtons"
import { input_fluid, load_from_item, output_fluid } from "../../matter/fluids"

// Slot layout (matches ui_datagen.ts methane_synthesizer definition)
const H2Input = 0, CO2Input = 1, BatterySlot = 2, CarbonSlot = 3, MethaneOutput = 4
const H2Display = 5, CO2Display = 6, MethaneDisplay = 7, EnergyDisplay = 8
const StatusDisplay = 9, StatusDetail = 10, ButtonSlot = 11
const ProcessButtonText = (state) => state ? 'Stop' : 'Synthesize'

const data = {
	energy: {input: "below", capacity: 16000, maxInput: 900},
	hydrogen: {input: "left", capacity: 4000},
	co2: {input: "right", capacity: 2000},
	methane: {output: "back", capacity: 4000},
	onTick(entity, block) {
		const container = entity.getComponent('minecraft:inventory').container
		const active = entity.getDynamicProperty('active')

		const variables = load_dynamic_object(entity, "machine_data")
		let energy = variables.energy || 0
		let hydrogen = variables.hydrogen || 0
		let co2 = variables.co2 || 0
		let methane = variables.methane || 0

		// Input processing
		energy = charge_from_machine(entity, block, energy)
		energy = charge_from_battery(entity, energy, BatterySlot)

		hydrogen = input_fluid({type: "hydrogen", slot: "hydrogen"}, entity, block, hydrogen)
		hydrogen = load_from_item(hydrogen, "hydrogen", data.hydrogen.capacity, container, H2Input)

		co2 = input_fluid({type: "co2", slot: "co2"}, entity, block, co2)
		co2 = load_from_item(co2, "co2", data.co2.capacity, container, CO2Input)

		methane = output_fluid({type: 'methane', slot: 'methane'}, entity, block, methane)

		// Status determination
		let status = '§6Idle'
		if (energy < 500) status = '§cLow energy'
		else if (!hydrogen && !co2) status = '§cNo Gas!'
		else if (methane + 5 > data.methane.capacity) status = '§cTank Full'
		else if (active && hydrogen && co2 && energy >= 500) {
			status = '§2Synthesizing'
			hydrogen = Math.max(0, hydrogen - 2)
			co2 = Math.max(0, co2 - 1)
			methane = Math.min(methane + 5, data.methane.capacity)
			const creative_battery = container.getItem(BatterySlot)?.typeId == "cosmos:creative_battery"
			energy = creative_battery ? energy : Math.max(0, energy - 500)
		}

		save_dynamic_object(entity, {energy, hydrogen, co2, methane}, "machine_data")

		// UI display
		if (system.currentTick % 3 == 0) {
			container.add_ui_display(H2Display, `Gas Storage\n(Hydrogen)\n§e${hydrogen} / ${data.hydrogen.capacity}`, Math.ceil((hydrogen / data.hydrogen.capacity) * 38))
			container.add_ui_display(CO2Display, `Gas Storage\n(Carbon Dioxide)\n§e${co2} / ${data.co2.capacity}`, Math.ceil((co2 / data.co2.capacity) * 38))
			container.add_ui_display(MethaneDisplay, `Gas Storage\n(Methane)\n§e${methane} / ${data.methane.capacity}`, Math.ceil((methane / data.methane.capacity) * 38))
			container.add_ui_display(EnergyDisplay, `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.energy.capacity} gJ`, Math.ceil((energy / data.energy.capacity) * 55))
			container.add_ui_display(StatusDisplay, `§rStatus:`)
			container.add_ui_display(StatusDetail, `  ${status}`)
		}

		if (container.was_ui_clicked(ButtonSlot, entity)) {
			const new_state = !active
			entity.setDynamicProperty('active', new_state)
			setup_ui_button(entity, ButtonSlot, ProcessButtonText(new_state))
		}
	},
	onPlace(entity) {
		const initial_state = true
		entity.setDynamicProperty('active', initial_state)
		setup_ui_button(entity, ButtonSlot, ProcessButtonText(initial_state))
	}
}; export default data
