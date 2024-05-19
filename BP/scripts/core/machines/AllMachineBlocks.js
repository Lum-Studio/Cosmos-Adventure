import { CoalGenerator } from "./blocks/index"

export default {
    "cosmos:coal_generator":{
        tileEntity: "cosmos:coal_generator",
		energy_output: "left",
        class: CoalGenerator 
    },
    "cosmos:energy_storage_module":{
        tileEntity: "cosmos:energy_storage_module",
		energy_output: "left",
		energy_input: "right",
        class: undefined
    },
    "cosmos:energy_storage_cluster":{
        tileEntity: "cosmos:energy_storage_cluster",
		energy_output: "left",
		energy_input: "right",
        class: undefined
    },
    "cosmos:oxygen_collector":{
        tileEntity: "cosmos:oxygen_collector",
		oxygen_output: "right",
		energy_input: "left",
        class: undefined
    }
}