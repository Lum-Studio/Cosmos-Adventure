import CoalGenerator from './blocks/CoalGenerator'
import EnergyStorage from './blocks/EnergyStorage'
import OxygenCollector from './blocks/OxygenCollector'
import Compressor from './blocks/Compressor'
import CircuitFabricator from './blocks/CircuitFabricator'
import Refinery from './blocks/Refinery'
import ElectricCompressor from './blocks/ElectricCompressor'
import OxygenCompressor from './blocks/OxygenCompressor'
import OxygenDecompressor from './blocks/OxygenDecompressor'
import FuelLoader from './blocks/FuelLoader'
import WaterElectrolyzer from './blocks/WaterElectrolyzer'
import GasLiquefier from './blocks/GasLiquefier'
import ElectricFurnace from './blocks/ElectricFurnace'
import Parachest from './blocks/Parachest'
import OxygenDistributor from './blocks/OxygenDistributor'
import OxygenStorage from './blocks/OxygenStorage'
import BasicSolarPanel from './blocks/BasicSolarPanel'
import Deconstructor from './blocks/Deconstructor'

const AllMachines = {
	coal_generator: CoalGenerator,
	compressor: Compressor,
	energy_storage_module: EnergyStorage.energy_storage_module,
	energy_storage_cluster: EnergyStorage.energy_storage_cluster,
	electric_compressor: ElectricCompressor,
	electric_furnace: ElectricFurnace,
	"deconstructor":{
		ui: "",
		class: Deconstructor,
		energy: {input: "right", capacity: 16000, maxInput: 45}
	},
	basic_solar_panel: BasicSolarPanel,
	oxygen_collector: OxygenCollector,
	oxygen_compressor: OxygenCompressor,
	oxygen_distributor: OxygenDistributor,
	oxygen_decompressor: OxygenDecompressor,
	"oxygen_storage_module": {
		ui: "§o§x§y§g§e§n§_§s§t§o§r§a§g§e",
		class: OxygenStorage,
		o2: {input: "right", "output": "left", capacity: 60000, maxInput: 16},
	},
	circuit_fabricator: CircuitFabricator,
	refinery: Refinery,
	fuel_loader: FuelLoader,
	water_electrolyzer: WaterElectrolyzer,
	gas_liquefier: GasLiquefier,
	parachest: Parachest
}

for (const machine in AllMachines) AllMachines[machine].ui = `§${machine.split('').join('§')}`
export default AllMachines
