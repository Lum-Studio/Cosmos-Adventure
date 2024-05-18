import { system, world } from "@minecraft/server";
import { MachineBlockEntity } from "../base/MachineBlockEntity";

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
        }, 10);
    }

    generateHeat() {
        const fuelContainer = this.entity.getComponent('minecraft:inventory').container;
        let fuelItem = fuelContainer.getItem(0);
        if (!fuelItem || !this.fuelTypes.has(fuelItem.typeId)) return;

        const isCoalBlock = fuelItem.typeId === 'minecraft:coal_block';
        const burnTime = this.entity.getDynamicProperty("burnTime") || 0;
        const heat = this.entity.getDynamicProperty("heat") || 0;
        const power = this.entity.getProperty("cosmos:power");
        fuelContainer.setItem(0, fuelItem.decrementStack());
        this.entity.setDynamicProperty("burnTime", isCoalBlock ? 3200 : 320);

        if (burnTime > 0) {
            this.entity.setDynamicProperty("burnTime", burnTime > 1 ? burnTime - 1 : 0);
            this.entity.setDynamicProperty("heat", heat < 99 ? heat + 1 : 100);
        } else if (power === 0) {
            this.entity.setDynamicProperty("heat", heat > 1 ? heat - 1 : 0);
        }

        if (burnTime !== 0 && heat === 100 && burnTime % 3 === 0) {
            this.entity.setProperty("cosmos:power", power < 119 ? power + 1 : 120);
        } else if (burnTime === 0 && system.currentTick % 3 === 0) {
            this.entity.setProperty("cosmos:power", power > 1 ? power - 1 : 0);
        }

        this.entity.nameTag = `bt ${Math.floor(burnTime / 2)}t, heat ${heat}%, po ${power}gJ/t`;
    }
}

