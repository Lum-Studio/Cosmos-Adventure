import { load_dynamic_object, save_dynamic_object } from "../../../api/utils.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";

function add_ui_display(block, entity, data) {
    const container = entity.getComponent('minecraft:inventory').container;
    data.forEach((val, i) => {
        container.add_ui_display(i + 1, String(val), 0);
    });
}

export class MachineBlock {}

export class AdvancedLaunchController extends MachineBlock {
    static energy = {input: "bottom", capacity: 100000, maxInput: 2500};
    
    static onTick(entity, block) {
        const container = entity.getComponent('minecraft:inventory').container;
        const variables = load_dynamic_object(entity, "machine_data");

        let energy = variables.energy || 0;
        let frequency = variables.frequency || 0;
        let destFrequency = variables.destFrequency || 0;
        let enabled = variables.enabled || false;
        let hideDest = variables.hideDest || false;
        
        let capacity = AdvancedLaunchController.energy.capacity;

        energy = charge_from_machine(entity, block, energy);
        energy = charge_from_battery(entity, energy, 0);

        save_dynamic_object(entity, {
            energy: energy,
            frequency: frequency,
            destFrequency: destFrequency,
            enabled: enabled,
            hideDest: hideDest
        }, "machine_data");

        try {
            entity.setProperty("ca:energy", energy);
        } catch (e) {}

        add_ui_display(block, entity, [
            Math.round(entity.getProperty("ca:energy") ?? energy),
            0, 0, 0, 0 // Placeholder states for the buttons/dropdowns if needed
        ]);
    }
}

export default AdvancedLaunchController;
