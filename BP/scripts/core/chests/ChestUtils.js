import { system } from "@minecraft/server";
export class ChestUtils {
    constructor(chest_entity) {
        this.chest_entity = chest_entity;
        this.maxOpen = 5;
        this.maxClose = -1;
        this.interval = 0;
        this.cooldown = 1;
    }
    open() {
        const { chest_entity, maxOpen, cooldown } = this;
        const { dimension, location } = chest_entity;
        if (chest_entity.hasTag('custom_open')) {
            const chest = this.getChest(chest_entity);
            if (chest.hasTag('custom_chest')) {
                dimension.playSound('random.chestopen', location);
                chest_entity.setDynamicProperty('isOpen', true);
                this.interval = system.runInterval(() => {
                    const chestState = chest.permutation.getState('custom:open');
                    const nextChestState = chest.permutation.withState('custom:open', chestState + 1);
                    chest.setPermutation(nextChestState);
                    if ((chestState + 1) >= maxOpen)
                        system.clearRun(this.interval);
                }, cooldown);
            }
            else {
                dimension.playSound('block.barrel.open', location);
                chest_entity.setDynamicProperty('isOpen', true);
                const openBarrel = chest.permutation.withState('custom:open', 1);
                chest.setPermutation(openBarrel);
            }
        }
    }
    close() {
        const { chest_entity, maxClose } = this;
        const { dimension, location } = chest_entity;
        if (chest_entity.hasTag('custom_open'))
            return;
        const chest = this.getChest(chest_entity);
        const chestState = chest?.permutation.getState('custom:open');
        const nextChestState = chest?.permutation.withState('custom:open', chestState - 1);
        if (chest?.hasTag('custom_chest')) {
            if ((chestState - 1) <= maxClose)
                return;
            chest?.setPermutation(nextChestState);
            if (chest_entity.getDynamicProperty('isOpen')) {
                chest_entity.setDynamicProperty('isOpen', false);
                dimension.playSound('random.chestclosed', location);
            }
        }
        else {
            if (chest_entity.getDynamicProperty('isOpen')) {
                chest_entity.setDynamicProperty('isOpen', false);
                const closedBarrel = chest.permutation.withState('custom:open', 0);
                chest.setPermutation(closedBarrel);
                dimension.playSound('block.barrel.close', location);
            }
        }
    }
    drop() {
        const { chest_entity } = this;
        const { dimension, location } = chest_entity;
        const chest = this.getChest(chest_entity);
        if (chest)
            return;
        const inv = chest_entity.getComponent('inventory').container;
        for (let i = 0; i < inv?.size; i++) {
            const item = inv?.getItem(i);
            if (item) {
                dimension.spawnItem(item, location);
                inv?.setItem(i, undefined);
            }
        }
        chest_entity.remove();
    }
    getChest(entity) {
        const { location, dimension } = entity;
        const chest = dimension.getBlock(location);
        if (chest?.hasTag('custom_chest') || chest?.hasTag('custom_barrel'))
            return chest;
    }
}
