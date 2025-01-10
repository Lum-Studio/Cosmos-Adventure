
import { world, EnchantmentType } from "@minecraft/server";


class EnchantDeshPickaxe {
    constructor(player) {
        this.player = player;
    }
   static enchant() {
        let inv = this.player.getComponent("inventory").container
        let item = inv.getItem(this.player.selectedSlotIndex);
        
        if (item && item.typeId === "cosmos:desh_pickaxe") {
            let enchant = item.getComponent('enchantable');
            const enchantment = { type: new EnchantmentType('silk_touch'), level: 1 };
            enchant.addEnchantment(enchantment);
            inv.setItem(this.player.selectedSlotIndex, item);
          }
        }
    }

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
		itemComponentRegistry.registerCustomComponent('cosmos:slimy_desh_pickaxe', {
			onPlayerDestroy({ block }) {
				EnchantDeshPickaxe.enchant(block);
			}
		});
	});