import { load_dynamic_object, save_dynamic_object } from "../../../api/utils.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";

export class MachineBlock {
}

export class ShortRangeTelepad extends MachineBlock {
    static energy = {input: "below", capacity: 100000, maxInput: 2500};
    
    static onTick(entity, block) {
        const container = entity.getComponent('minecraft:inventory').container;
        const variables = load_dynamic_object(entity, "machine_data");

        let energy = variables.energy || 0;
        let address = variables.address || 0;
        let targetAddress = variables.targetAddress || 0;

        energy = charge_from_machine(entity, block, energy);
        energy = charge_from_battery(entity, energy, 0);

        save_dynamic_object(entity, {
            energy: energy,
            address: address,
            targetAddress: targetAddress
        }, "machine_data");

        const displayContext = {
            address: address,
            targetAddress: targetAddress,
            energy: energy,
            maxEnergy: this.energy.capacity
        };

        (function() {
            // Example of the required UI display logic
            container.add_ui_display(1, "Enable Controller", 0);
            container.add_ui_display(2, String(this.address || 0), 0);
            container.add_ui_display(3, String(this.targetAddress || 0), 0);
            container.add_ui_display(4, "Energy", Math.round((this.energy / this.maxEnergy) * 100) || 0); // scale max 100
            container.add_ui_display(5, "Receiving: OK", 0);
            container.add_ui_display(6, "Sending: OK", 0);
        }).call(displayContext);
    }
}

export default ShortRangeTelepad;
