import { system } from "@minecraft/server";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import { load_dynamic_object, save_dynamic_object } from "../../../api/utils.js";
import { machine_buttons, setup_ui_button } from "../MachineButtons.js";

const BatterySlot = 0;
const ButtonSlot = 73;

const data = {
	energy: {input: "right", capacity: 16000, maxInput: 120},
	items: {
		top_input: Array.from({length: 72}, (_, i) => i + 1),
		side_input: Array.from({length: 72}, (_, i) => i + 1)
	},
	onTick(entity, block) {
		const container = entity.getComponent('minecraft:inventory').container;
		const variables = load_dynamic_object(entity, "machine_data");
		let energy = variables.energy ?? 0;
		
		energy = charge_from_machine(entity, block, energy);
		energy = charge_from_battery(entity, energy, BatterySlot);

		// Placeholder logic for mining/docking
		let isMining = variables.isMining ?? false;

		save_dynamic_object(entity, {energy, isMining}, "machine_data");


        container.add_ui_display(73, "Recall");
	},
    onPlace(entity) {
        setup_ui_button(entity, ButtonSlot, "Recall Miner");
    }
};

const buttons = []; 
machine_buttons.set('cosmos:astro_miner_dock', buttons);
buttons[ButtonSlot] = function (entity, item) {
    const variables = load_dynamic_object(entity, "machine_data");
    variables.isMining = false;
    save_dynamic_object(entity, variables, "machine_data");
};

export default data;
