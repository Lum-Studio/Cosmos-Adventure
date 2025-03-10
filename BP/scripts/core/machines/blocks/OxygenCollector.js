import { system, ItemStack } from "@minecraft/server";
import { get_data } from "../../../api/utils";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity";

export default class {
    constructor(entity, block) {
        this.entity = entity;
        this.block = block;
        if (entity.isValid()) this.collect_oxygen();
    }

    onPlace() {
        const container = this.entity.getComponent('minecraft:inventory').container;
        const data = get_data(this.entity);

        // Initialize UI elements with individual ItemStack instances
        const energyCounter = new ItemStack('cosmos:ui');
        energyCounter.nameTag = `cosmos:§energy${Math.round((0 / data.capacity) * 55)}`;
        container.setItem(12, energyCounter);
        
        const progressCounter = new ItemStack('cosmos:ui');
        progressCounter.nameTag = `cosmos:§prog${Math.ceil((0 / 200) * 52)}`;
        container.setItem(13, progressCounter);
        
        const statusCounter = new ItemStack('cosmos:ui');
        statusCounter.nameTag = `cosmos:  Status:\n§6No Valid Oxygen Tank`;
        container.setItem(14, statusCounter);
        
        const energyStorageCounter = new ItemStack('cosmos:ui');
        energyStorageCounter.nameTag = `Energy Storage\n§aEnergy: ${0} gJ\n§cMax Energy: ${data.capacity} gJ`;
        container.setItem(15, energyStorageCounter);
    }

    collect_oxygen() {
        const container = this.entity.getComponent('minecraft:inventory').container;
        const data = get_data(this.entity);

        let energy = this.entity.getDynamicProperty("cosmos_energy") || 0;
        let progress = this.entity.getDynamicProperty("cosmos_progress") || 0;
        const first_energy = energy;
        const first_progress = progress;

        // Energy management
        energy = charge_from_machine(this.entity, this.block, energy);
        energy = charge_from_battery(this.entity, energy, 11);

        // Check for a valid oxygen tank in slot 3
        const oxygen_tank = container.getItem(3);
        const has_tank = oxygen_tank?.typeId === "cosmos:oxygen_tank";
        const tank_space = has_tank ? (oxygen_tank.maxAmount - oxygen_tank.amount) : 0;

        // Production logic
        const production_rate = 5; // Oxygen units per tick
        const energy_cost = 2; // Energy per tick
        const can_produce = has_tank && tank_space > 0 && energy > 0;

        if (can_produce) {
            // Update progress and energy.
            progress = Math.min(progress + production_rate, 200);
            energy = Math.max(energy - energy_cost, 0);

            // Complete production cycle when progress is full
            if (progress >= 200) {
                // increment the oxygen tank's amount
                oxygen_tank.amount = Math.min(oxygen_tank.amount + 1, oxygen_tank.maxAmount);
                container.setItem(3, oxygen_tank);
                progress = 0;
                this.block.dimension.playSound("random.anvil_land", this.entity.location);
            }
        } else if (progress > 0) {
            progress = Math.max(progress - production_rate, 0);
        }

        // Update UI if energy or progress has changed
        if (energy !== first_energy) {
            this.entity.setDynamicProperty("cosmos_energy", energy);
            const energyCounter = new ItemStack('cosmos:ui');
            energyCounter.nameTag = `cosmos:§energy${Math.round((energy / data.capacity) * 55)}`;
            container.setItem(12, energyCounter);
            
            const energyStorageCounter = new ItemStack('cosmos:ui');
            energyStorageCounter.nameTag = `Energy Storage\n§aEnergy: ${Math.round(energy)} gJ\n§cMax Energy: ${data.capacity} gJ`;
            container.setItem(15, energyStorageCounter);
        }

        if (progress !== first_progress) {
            this.entity.setDynamicProperty("cosmos_progress", progress);
            const progressCounter = new ItemStack('cosmos:ui');
            progressCounter.nameTag = `cosmos:§prog${Math.ceil((progress / 200) * 52)}`;
            container.setItem(13, progressCounter);
            
            const status = has_tank ? 
                (can_produce ? "§aCollecting" : "§6Not Enough Power") : 
                "§cNo Oxygen Tank";
            const statusCounter = new ItemStack('cosmos:ui');
            statusCounter.nameTag = `cosmos:  Status:\n${status}`;
            container.setItem(14, statusCounter);
        }
    }
}
