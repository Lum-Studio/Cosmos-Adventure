
import { world, EnchantmentType } from "@minecraft/server";


class EnchantDeshPickaxe {
    constructor(player) {
        this.player = player;
    }

    enchant() {
        let inv = this.player.getComponent("inventory").container
        let item = inv.getItem(this.player.selectedSlotIndex);
        
        if (item && item.typeId === "cosmos:desh_pickaxe") {
            let enchComp = item.getComponent('enchantable');
            if (!enchComp) {
                console.log("The selected item is not enchantable.");
                return; // Exit if the item is not enchantable
            }
            const enchantment = { type: new EnchantmentType('silk_touch'), level: 1 };
            enchComp.addEnchantment(enchantment);
            inv.setItem(this.player.selectedSlotIndex, item);
          }
        }
    }

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
		blockComponentRegistry.registerCustomComponent('cosmos:enchant_desh', {
			onPlayerDestroy({ block }) {
				EnchantDeshPickaxe.enchant(block);
			}
		});
	});