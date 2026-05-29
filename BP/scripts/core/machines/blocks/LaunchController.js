import { load_dynamic_object, save_dynamic_object } from "../../../api/utils.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";

export class MachineBlock {}

export class LaunchController extends MachineBlock {
    static energy = {input: "below", capacity: 100000, maxInput: 2500};
    
    static onTick(entity, block) {
        const container = entity.getComponent('minecraft:inventory').container;
        const variables = load_dynamic_object(entity, "machine_data");

        let energy = variables.energy || 0;
        let frequency = variables.frequency || 0;
        let destFrequency = variables.destFrequency || 0;
        let enabled = variables.enabled || false;
        let hideDest = variables.hideDest || false;
        
        let capacity = LaunchController.energy.capacity;

        energy = charge_from_machine(entity, block, energy);
        energy = charge_from_battery(entity, energy, 0);

        save_dynamic_object(entity, {
            energy: energy,
            frequency: frequency,
            destFrequency: destFrequency,
            enabled: enabled,
            hideDest: hideDest
        }, "machine_data");

        container.add_ui_display(1, "Energy", Math.round((energy / capacity) * 100) || 0);
        container.add_ui_display(2, enabled ? "Disable" : "Enable", 0);
        container.add_ui_display(3, String(frequency || 0), 0);
        container.add_ui_display(4, String(destFrequency || 0), 0);
        container.add_ui_display(5, hideDest ? "Unhide Dest" : "Hide Dest", 0);
        container.add_ui_display(6, "Advanced...", 0);
        container.add_ui_display(7, "Active", 0);
    }
}

export default LaunchController;
