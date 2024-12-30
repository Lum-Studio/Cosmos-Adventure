import { system, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity.js";
import { charge_from_battery, charge_from_machine, location_of_side} from "../../matter/electricity.js";
import { get_data, get_lore } from "../../../api/utils.js";

function get_rockets(block){
    let rockets = []
    let pad_one = location_of_side(block, "front")
    let pad_two = location_of_side(block, "back")
    pad_one = block.dimension.getBlock({x: block.location.x + ((pad_one.x - block.location.x) * 2), y: block.location.y, z: block.location.z + ((pad_one.z - block.location.z) * 2)});
    pad_two = block.dimension.getBlock({x: block.location.x + ((pad_two.x - block.location.x) * 2), y: block.location.y, z: block.location.z + ((pad_two.z - block.location.z) * 2)});
    pad_one = (!pad_one.isAir && pad_one.typeId === "cosmos:rocket_launch_pad" && pad_one.permutation.getState("cosmos:center"))? pad_one:
    undefined;
    pad_two = (!pad_two.isAir && pad_two.typeId === "cosmos:rocket_launch_pad" && pad_two.permutation.getState("cosmos:center"))? pad_two:
    undefined;
    let rocket_one = (pad_one)? pad_one.dimension.getEntities({type: "cosmos:rocket_tier_1", location: pad_two.center(), maxDistance: 1}):
    [];
    let rocket_two = (pad_two)? pad_two.dimension.getEntities({type: "cosmos:rocket_tier_1", location: pad_two.center(), maxDistance: 1}):
    [];
    if(rocket_one.length > 0) rockets.push(rocket_one[0])
    if(rocket_two.length > 0) rockets.push(rocket_two[0])
    return rockets;
}

export default class extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        if (this.entity.isValid()) this.load_fuel()
    }

    load_fuel(){
        const stopped = this.entity.getDynamicProperty('stopped')
        const container = this.entity.getComponent('minecraft:inventory').container
		const input = container.getItem(0)
		const data = get_data(this.entity)
		const dimension = this.entity.dimension
		let energy = get_lore(container, data, "energy")
		let fuel = get_lore(container, data, "fuel")
		
	    energy = charge_from_machine(this.entity, this.block, energy)
		
		energy = charge_from_battery(this.entity, energy, 1)
		
		if (fuel + 1000 <= data.fuel_capacity && input?.typeId == "cosmos:fuel_bucket") {
			container.setItem(0, new ItemStack('bucket'))
			fuel += 1000
		}
		if(!stopped && energy > 120 && fuel > 2){
		    let rockets = get_rockets(this.block)
		    if(rockets.length > 0){
		        rockets.forEach((rocket) =>{
		            let fuel_level = rocket.getDynamicProperty("fuel_level")
		            fuel_level = (fuel_level)? fuel_level:
		            0;
		            if(fuel_level < 1000){
		                let level = Math.min(1000, fuel_level + 2)
		            rocket.setDynamicProperty("fuel_level", level)
		            fuel = Math.max(0, fuel - 2)
		            }
		        })
		        
		    }
		}
		const status =
		energy == 0 ? "§4No Power" : 
		fuel == 0 ? "§cNo Fuel" :
		energy < 120 ? "§6Not Enough Power":
		stopped ? "§6Ready" :
		"§2Loading"

		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§energy${Math.round((energy / data.capacity) * 55)}`
		container.setItem(2, counter)
		counter.nameTag = `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.capacity} gJ`
		container.setItem(3, counter)
		counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(fuel / 1000) / (data.fuel_capacity / 1000)) * 38)}§liquid:fuel`
		container.setItem(4, counter)
		counter.nameTag = `Fuel Storage\n§eFuel: ${fuel} / ${data.fuel_capacity} mB`
		container.setItem(5, counter)
		counter.nameTag = `Status:\n${status}`
		container.setItem(6, counter)
		const ui_button = new ItemStack('cosmos:ui_button')
		ui_button.nameTag = `§button${stopped ? 'Stop Loading' : 'Loading'}`
		if (!container.getItem(7)) {
			this.entity.runCommand('clear @a cosmos:ui_button')
			container.setItem(7, ui_button);
			this.entity.setDynamicProperty('stopped', !stopped)
		}
		counter.nameTag = ``
		counter.setLore([''+energy, ''+fuel])
		container.setItem(data.lore.slot, counter)
	}
}
