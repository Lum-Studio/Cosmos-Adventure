import * as m from "./blocks/index"

export default {
    "coal_generator":{
        tileEntity: "cosmos:machine:coal_generator",
		ui: "§c§o§a§l§_§g§e§n§e§r§a§t§o§r",
        class: m.CoalGenerator,
		lore: {slot: 3, power: 2},

		energy_output: "right",
		maxPower: 120,
    },
    "energy_storage_module":{
        tileEntity: "cosmos:machine:energy_storage_module",
		ui: "§e§n§e§r§g§y§_§s§t§o§r§a§g§e§_§m§o§d§u§l§e",
        class: undefined,
		lore: {slot: 4, energy: 0, power: 1},
		
		energy_input: "left",
		capacity: 500000,
		
		energy_output: "right",
		maxPower: 300,
    },
    "energy_storage_cluster":{
        tileEntity: "cosmos:machine:energy_storage_cluster",
		ui: "§e§n§e§r§g§y§_§s§t§o§r§a§g§e§_§c§l§u§s§t§e§r",
        class: undefined,
		lore: {slot: 4, energy: 0, power: 1},

		energy_output: "right",
		maxPower: 1800,

		energy_input: "left",
		capacity: 2500000,
    },
    "oxygen_collector":{
        tileEntity: "cosmos:machine:oxygen_collector",
		ui: "",
        class: m.OxygenCollector,
		lore: {slot: 4, energy: 0, o2: 1},
		
		energy_input: "right",
		capacity: 16000,
		
		oxygen_output: "left",
		o2_capacity: 6000,
    }
}