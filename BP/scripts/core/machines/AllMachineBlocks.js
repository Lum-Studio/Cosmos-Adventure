import * as m from "./blocks/index"

export default {
    "coal_generator":{
        tileEntity: "cosmos:machine:coal_generator",
        class: m.CoalGenerator,
		slots: {burnTime: 1, heat: 2, power: 3},

		energy_output: "right",
		maxPower: 120,
    },
    "energy_storage_module":{
        tileEntity: "cosmos:machine:energy_storage_module",
        class: undefined,
		slots: {energy: 2, power: 3},
		
		energy_input: "left",
		capacity: 500000,
		
		energy_output: "right",
		maxPower: 300,
    },
    "energy_storage_cluster":{
        tileEntity: "cosmos:machine:energy_storage_cluster",
        class: undefined,
		slots: {energy: 2, power: 3},

		energy_output: "right",
		maxPower: 1800,

		energy_input: "left",
		capacity: 2500000,
    },
    "oxygen_collector":{
        tileEntity: "cosmos:machine:oxygen_collector",
        class: m.OxygenCollector,
		slots: {energy: 1, o2: 2},
		
		energy_input: "right",
		capacity: 16000,
		
		oxygen_output: "left",
		o2_capacity: 6000,
    }
}