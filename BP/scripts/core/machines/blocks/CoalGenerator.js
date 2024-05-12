import { system } from "@minecraft/server";
import { MachineBlockEntity } from "../base/MachineBlockEntity";

export class CoalGenerator extends MachineBlockEntity {
	constructor(block, entity) {
		super(block, entity);
		this.burnTime = this.entity.getDynamicProperty("burnTime") ?? 0
		this.heat = this.entity.getDynamicProperty("heat") ?? 0
		this.power = this.entity.getProperty("cosmos:power")
		system.runInterval(() => this.generateHeat(), 10);
	}
	generateHeat() {
		const fuelContainer = this.entity.getComponent('minecraft:inventory').container;
		let fuelItem = fuelContainer.getItem(0);
		if (!fuelItem || ["minecraft:coal", "minecraft:charcoal", "minecraft:coal_tileEntity"].includes(fuelItem.typeId)) return;

		//world.sendMessage(`bt ${Math.floor(burnTime /2)}s, heat ${heat}%, po ${power}gJ/t`)

		fuelItem.decrementStack()
		fuelContainer.setItem(0, fuelItem)
		this.entity.setDynamicProperty("burnTime", fuelItem.typeId == 'minecraft:coalEntity' ? 3200 : 320)

		if (this.burnTime > 0) {
			this.entity.setDynamicProperty("burnTime", this.burnTime > 1 ? this.burnTime - 1 : 0)
			this.entity.setDynamicProperty("heat", this.heat < 99 ? this.heat + 1 : 100)
		}
		if (this.burnTime == 0 && this.power == 0) {
			this.entity.setDynamicProperty("heat", this.heat > 1 ? this.heat - 1 : 0)
		}
		if (this.burnTime != 0 && this.heat == 100 && this.burnTime % 3 == 0) {
			this.entity.setProperty("cosmos:power", this.power < 119 ? this.power + 1 : 120)
		}
		if (this.burnTime == 0 && system.currentTick % 3 == 0) {
			this.entity.setProperty("cosmos:power", this.power > 1 ? this.power - 1 : 0)
		}

		this.entity.nameTag = `bt ${Math.floor(this.burnTime / 2)}t, heat ${this.heat}%, po ${this.power}gJ/t`
		//world.sendMessage(`bt ${Math.floor(bt /2)}s, heat ${he}%, po ${po}gJ/t`)

	}
}

