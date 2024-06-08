import { CircuitFabricator, CoalGenerator, Compressor, EnergyStorage } from "./index"

export default {
	"coal_generator": {
		tileEntity: "cosmos:machine:coal_generator",
		ui: "§c§o§a§l§_§g§e§n§e§r§a§t§o§r",
		class: CoalGenerator,
		lore: { slot: 3, power: 2 },

		energy_output: "right",
		maxPower: 120,
	},
	"compressor": {
		tileEntity: "cosmos:machine:compressor",
		ui: "§c§o§m§p§r§e§s§s§o§r",
		class: Compressor,
		lore: { slot: 13 },
	},
	"energy_storage_module": {
		tileEntity: "cosmos:machine:energy_storage_module",
		ui: "§e§n§e§r§g§y§_§s§t§o§r§a§g§e§_§m§o§d§u§l§e",
		class: EnergyStorage,
		lore: { slot: 4, energy: 0, power: 1 },

		energy_input: "left",
		capacity: 500000,

		energy_output: "right",
		maxPower: 300,
		maxInput: 2000,
	},
	"energy_storage_cluster": {
		tileEntity: "cosmos:machine:energy_storage_cluster",
		ui: "§e§n§e§r§g§y§_§s§t§o§r§a§g§e§_§c§l§u§s§t§e§r",
		class: EnergyStorage,
		lore: { slot: 4, energy: 0, power: 1 },

		energy_output: "right",
		maxPower: 1800,
		maxInput: 2000,

		energy_input: "left",
		capacity: 2500000,
	},
	"oxygen_collector": {
		tileEntity: "cosmos:machine:oxygen_collector",
		ui: "",
		class: OxygenCollector,
		lore: { slot: 4, energy: 0, o2: 1 },

		energy_input: "right",
		capacity: 16000,
		maxInput: 50,

		oxygen_output: "left",
		o2_capacity: 6000,
	},
	"circuit_fabricator": {
		tileEntity: "cosmos:machine:circuit_fabricator",
		ui: "§c§i§r§c§u§i§t§_§f§a§b§r§i§c§a§t§o§r",
		class: CircuitFabricator,
		lore: { slot: 12, energy: 0 },

		energy_input: "right",
		capacity: 16000,
		maxInput: 50
	}
}