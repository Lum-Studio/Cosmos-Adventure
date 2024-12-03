import { system, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import { get_data, get_lore } from "../../../api/utils.js";

function make_smoke({dimension, x, y, z}) {
	const flame = (X, Y, Z) => {dimension.spawnParticle('minecraft:basic_flame_particle', {x: x + X, y: y + Y, z: z + Z})}
	const smoke = (X, Y, Z) => {dimension.spawnParticle('minecraft:basic_smoke_particle', {x: x + X, y: y + Y, z: z + Z})}
	flame(0.5, 0.95, 0.5); smoke(0.5, 0.9, 0.5)
	flame(0.6, 0.95, 0.4); smoke(0.7, 0.9, 0.3)
	flame(0.6, 0.95, 0.6); smoke(0.7, 0.9, 0.7)
	flame(0.4, 0.95, 0.4); smoke(0.3, 0.9, 0.3)
	flame(0.4, 0.95, 0.6); smoke(0.3, 0.9, 0.7)
	smoke(0.5, 1, 0.7); smoke(0.7, 1, 0.5)
	smoke(0.5, 1, 0.3); smoke(0.3, 1, 0.5)
}

export default class extends MachineBlockEntity {
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
            this.refine();
        });
    }

    refine() {
		//3 slots for items + slot for lore + slot for button + total + ? for ui
        const container = this.entity.getComponent('minecraft:inventory').container
		const stopped = this.entity.getDynamicProperty("stopped")
		const input = container.getItem(0)
		const output = container.getItem(1)
		const data = get_data(this.entity)
		
		let energy = get_lore(container, data, "energy")
		let oil = get_lore(container, data, "oil")
		let fuel = get_lore(container, data, "fuel")
		
	    energy = charge_from_machine(this.entity, this.block, energy)
		
		energy = charge_from_battery(this.entity, energy, 2)

		if (system.currentTick % 30 == 0) energy -= Math.min(10, energy)

		if (oil + 1000 <= data.oil_capacity && input?.typeId == "cosmos:oil_bucket") {
			container.setItem(0, new ItemStack('bucket'))
			oil += 1000
		}
		if (fuel >= 1000 && output?.typeId == "minecraft:bucket" && output.amount == 1) {
			container.setItem(1, new ItemStack('cosmos:fuel_bucket'))
			fuel -= 1000
		}

		if (!stopped && system.currentTick % 2 == 0 && oil > 0 && energy > 0 && fuel < data.fuel_capacity) {
			if (energy > 120) {oil-- ; fuel++}
			if (system.currentTick % 20 == 0) make_smoke(this.block)
			energy -= Math.min(120, energy) 
		}

		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = ``
		counter.setLore([''+energy, ''+oil, ''+fuel])
		container.setItem(12, counter)
	}
}

