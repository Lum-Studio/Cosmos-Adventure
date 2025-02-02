import { system, ItemStack } from "@minecraft/server";
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

export default class {
    constructor(entity) {
        this.entity = entity
        if (entity.isValid()) this.refine()
    }

	onPlace(){
		const container = this.entity.getComponent('minecraft:inventory').container
		const data = get_data(this.entity);
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§energy${Math.round((0 / data.capacity) * 55)}`
		container.setItem(3, counter)
		counter.nameTag = `Energy Storage\n§aEnergy: ${0} gJ\n§cMax Energy: ${data.capacity} gJ`
		container.setItem(4, counter)
		counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(0 / 1000) / (data.oil_capacity / 1000)) * 38)}§liquid:oil`
		container.setItem(5, counter)
		counter.nameTag = `Oil Storage\n§eOil: ${0} / ${data.oil_capacity} mB`
		container.setItem(6, counter)
		counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(0 / 1000) / (data.fuel_capacity / 1000)) * 38)}§liquid:fuel`
		container.setItem(7, counter)
		counter.nameTag = `Fuel Storage\n§eFuel: ${0} / ${data.fuel_capacity} mB`
		container.setItem(8, counter)
	}
    refine() {
		//3 slots for items + slot for lore + slot for button + total + ? for ui
        const container = this.entity.getComponent('minecraft:inventory').container
		const stopped = this.entity.getDynamicProperty("stopped")
		const input = container.getItem(0)
		const output = container.getItem(1)
		const data = get_data(this.entity)
		const dimension = this.entity.dimension
		
		let energy = this.entity.getDynamicProperty("cosmos_energy");
		energy = (!energy)? 0:
		energy;
		let oil = this.entity.getDynamicProperty("cosmos_oil");
		oil = (!oil)? 0:
		oil;
		let fuel = this.entity.getDynamicProperty("cosmos_fuel");
		fuel = (!fuel)? 0:
		fuel;

		let first_energy = energy;
		let first_oil = oil;
		let first_fuel = fuel;
		
	    energy = charge_from_machine(this.entity, this.block, energy)
		
		energy = charge_from_battery(this.entity, energy, 2)

		if (system.currentTick % 30 == 0) energy -= Math.min(10, energy)

		if (oil + 1000 <= data.oil_capacity && input?.typeId == "cosmos:oil_bucket") {
			container.setItem(0, new ItemStack('bucket'))
			oil += 1000
		}

		const player_location = dimension.getPlayers({
			location: this.entity.location,
			closest: 1,
			maxDistance: 6
		})[0]?.location
		if (input && input.typeId != "cosmos:oil_bucket" && player_location) {
			dimension.spawnItem(input, player_location)
			container.setItem(0)
		}

		if (fuel >= 1000 && output?.typeId == "minecraft:bucket" && output.amount == 1) {
			container.setItem(1, new ItemStack('cosmos:fuel_bucket'))
			fuel -= 1000
		}

		if (!stopped && system.currentTick % 2 == 0 && oil > 0 && energy > 0 && fuel < data.fuel_capacity) {
			if (energy >= 120) {oil-- ; fuel++; energy -= 120 }
			if (system.currentTick % 20 == 0) make_smoke(this.block)
		}

		const status =
		energy == 0 ? "§4No Power" : 
		oil == 0 ? "§cNo Oil" :
		energy < 120 ? "§6Not Enough Power" : 
		fuel == data.fuel_capacity ? "§cFull" :
		stopped ? "§6Ready" : 
		"§2Refining"

		const counter = new ItemStack('cosmos:ui')
		if(oil !== first_oil){
			this.entity.setDynamicProperty("cosmos_oil", oil)
			counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(oil / 1000) / (data.oil_capacity / 1000)) * 38)}§liquid:oil`
			container.setItem(5, counter)
			counter.nameTag = `Oil Storage\n§eOil: ${oil} / ${data.oil_capacity} mB`
			container.setItem(6, counter)
		}
		if(energy !== first_energy){
			this.entity.setDynamicProperty("cosmos_energy", energy)
			counter.nameTag = `cosmos:§energy${Math.round((energy / data.capacity) * 55)}`
			container.setItem(3, counter)
			counter.nameTag = `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.capacity} gJ`
			container.setItem(4, counter)
		}
		if(fuel !== first_fuel){
			this.entity.setDynamicProperty("cosmos_fuel", fuel)
			counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(fuel / 1000) / (data.fuel_capacity / 1000)) * 38)}§liquid:fuel`
			container.setItem(7, counter)
			counter.nameTag = `Fuel Storage\n§eFuel: ${fuel} / ${data.fuel_capacity} mB`
			container.setItem(8, counter)
		}
		counter.nameTag = `Status:\n${status}`
		container.setItem(9, counter)
		const ui_button = new ItemStack('cosmos:ui_button')
		ui_button.nameTag = `§button${stopped ? 'Stop Refining' : 'Refine'}`
		if (!container.getItem(10)) {
			this.entity.runCommand('clear @a cosmos:ui_button')
			container.setItem(10, ui_button);
			this.entity.setDynamicProperty('stopped', !stopped)
		}
	}
}

