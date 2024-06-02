import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";
import { location_of, get_entity, charge_from_machine, charge_from_battery, update_baterry, } from "../../energy/electricity.js";
import machines from "../AllMachineBlocks"

function get_data(machine) {return machines[machine.typeId.replace('cosmos:machine:', '')]}
function str(object) { return JSON.stringify(object) }
function say(message='yes') {world.sendMessage(''+message)}


function charge_machine(machine, energy) {
	const data = get_data(machine)
	const output_entity = get_entity(machine.dimension, location_of(machine, data.energy_output), "has_power_input")
	if ( output_entity && Math.min(energy, data.maxPower) > 0 ) {
		const output_container = output_entity.getComponent('minecraft:inventory').container
		const output_data = get_data(output_entity)
		const power = Math.min(energy, data.maxPower)
		const lore = output_container.getItem(output_data.lore.slot)?.getLore()
		const output_energy = lore ? + lore[output_data.lore.energy] : output_data.capacity
		const space = output_data.capacity - output_energy
		const io = str(location_of(output_entity, output_data.energy_input))
		if ( str(machine.location) == io ) {
			energy -= Math.min(output_data.maxInput, power, space)
		}
	} return energy
}

function charge_battery(machine, energy, slot) {
	const data = get_data(machine)
	const container = machine.getComponent('minecraft:inventory').container
	const battery = container.getItem(slot)
	if (battery && energy > 0 && (battery.getDynamicProperty('energy') ?? 0) < 15000 ) {
		let charge = battery.getDynamicProperty('energy') ?? 0
		const space = 15000 - charge
		charge += Math.min(200, energy, space)
		energy -= Math.min(200, energy, space)
		container.setItem(slot, update_baterry(battery, charge))
	} return energy
}

export class EnergyStorage extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        this.fuelTypes = new Set(["minecraft:coal", "minecraft:charcoal", "minecraft:coal_block"]);
        this.start();
    }

    start() {
        this.runId = system.runInterval(() => {
            if (!this.entity.isValid()) {
                system.clearRun(this.runId);
                return;
            }
            this.processEnergy();
        });
    }

	processEnergy() {
		//retrieve data
		const store = this.entity
		const container = this.entity.getComponent('minecraft:inventory').container;
		const store_data = get_data(store)
		let energy = container.getItem(4) ? + container.getItem(4).getLore()[0] : 0
		
		energy = charge_machine(store, energy)
		
		energy = charge_from_machine(store, energy)
		
		energy = charge_battery(store, energy, 0)
		
		energy = charge_from_battery(store, energy, 1)
		
		//store and display data
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§. ${energy} gJ\nof ${store_data.capacity} gJ`
		container.setItem(2, counter)
		counter.nameTag = `cosmos:f${Math.ceil((energy/ store_data.capacity) * 75 )}`
		container.setItem(3, counter)
		counter.nameTag = ``
		counter.setLore([''+energy, ''+Math.min(energy, store_data.maxPower)])
		container.setItem(4, counter)
		
		//change the block look
		const fill_level = Math.round((energy/ store_data.capacity) * 16 )
		const direction = store.getProperty('cosmos:direction')
		try { if (fill_level == 16) {
			this.block.setPermutation(BlockPermutation.resolve(this.block.typeId, {
				"minecraft:cardinal_direction": direction,
				"cosmos:full": true
			}))
		} else this.block.setPermutation(BlockPermutation.resolve(this.block.typeId, {
			"cosmos:fill_level": fill_level, "minecraft:cardinal_direction": direction, 
			"cosmos:full": false
		}))} catch (error) {null}
	}
}

