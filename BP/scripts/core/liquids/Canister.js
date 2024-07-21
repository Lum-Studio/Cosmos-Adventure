import { Container, ItemStack, system } from "@minecraft/server";

class Canister {
    static empty = 0;
    static full = 6;
    /**
     * 
     * @param {Liquid} liquid 
     */
    id;
    constructor(liquid) {
      this.id = `cosmos:${liquid.getType()}_canister_partial`;
    };
    /**
     * function for get canister id dependences from his liquid level. Empty is 0, full is 6;
     * @param {number} liquid_level 
     */
    get(liquid_level) {
        return `${this.id}_${level}`;
    };
    /**
     * function for get a canister filling from current ItemStack
     * @param {ItemStack} stack 
     */
    getFilling(stack) {
        return Number(stack.typeId.slice(-1, stack.typeId.length));
    };
    /**
     * 
     * @param {string} liquid 
     * @param {Container} container 
     * @param {number} slot 
     */
    extract(liquid, container, slot) {
       const canister_slot = container.getItem(slot);
       const liquid_level = this.getFilling(canister_slot);
       if(liquid >= 150 || liquid_level >= Canister.full) return;
       if(system.currentTick % 10 === 0) {
        container.setItem(slot, this.get(liquid_level+1));
        liquid-=150;
       };
    };

    static OIL = new Canister(Liquid.OIL);
    static FUEL = new Canister(Liquid.FUEL);
} 
