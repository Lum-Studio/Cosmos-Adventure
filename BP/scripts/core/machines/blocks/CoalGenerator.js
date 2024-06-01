import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";

export class CoalGenerator extends MachineBlockEntity {
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
            this.generateHeat();
        });
    }

    generateHeat() {
        const container = this.entity.getComponent('minecraft:inventory').container;
        const fuelItem = container.getItem(0);
		const isCoalBlock = fuelItem?.typeId === 'minecraft:coal_block';
        let burnTime = container.getItem(3) ? + container.getItem(3).getLore()[0] : 0
		let heat = container.getItem(3) ? + container.getItem(3).getLore()[1] : 0
		let power = container.getItem(3) ? + container.getItem(3).getLore()[2] : 0
		
        if ( this.fuelTypes.has(fuelItem?.typeId) && burnTime == 0) {
			container.setItem(0, fuelItem.decrementStack())
			burnTime = isCoalBlock ? 3200 : 320
		}
		if (burnTime > 0) burnTime--
		
		if (burnTime > 0 && heat < 100) heat++
		
		if (burnTime == 0 && heat > 0 && power == 0) heat--
        
        if (burnTime > 0 && heat == 100 && burnTime % 3 == 0 && power < 120) power++
        
		if (burnTime == 0 && system.currentTick % 3 == 0 && power > 0) power--
		
		const counter = new ItemStack('clock')
		counter.nameTag = `cosmos:${power == 0 ? 'Not Generating' : 'Generating'}`
		container.setItem(1, counter)
		counter.nameTag = `cosmos:${power == 0 ? ' Hull Heat: ' + heat + '%%' : '  §r' + power + ' gJ/t'}`
		container.setItem(2, counter)
		counter.nameTag = ``
		counter.setLore([''+burnTime, ''+heat, ''+power])
		container.setItem(3, counter)
    }
}

