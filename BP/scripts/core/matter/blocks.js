import { system, world, ItemStack, BlockPermutation } from "@minecraft/server"

import "../blocks/aluminum_wire.js"
import "../blocks/fluid_tank.js"
import "../blocks/fluid_pipe.js"
import "../blocks/stairs.js"
import "../blocks/launch_pads.js"
import "../blocks/hydraulic_platform.js"
import "../blocks/nasa_workbench.js"
import "../blocks/cavernous_vines.js"
import "../blocks/treasure_chest.js"
import "../blocks/dishbase.js"

export const cheese_block = {
    onPlayerInteract({player, block, dimension}) {
        let hunger = player.getComponent("minecraft:player.hunger");
        if(hunger.currentValue == hunger.effectiveMax || ['Creative', 'Spectator'].includes(player.getGameMode()) || !block) return
        const cheese = block.permutation
        const size = cheese.getState('cosmos:cheese_part_visibility')
        const air = BlockPermutation.resolve("minecraft:air")
        block.setPermutation(size > 0 ? cheese.withState('cosmos:cheese_part_visibility', size - 1) : air)
        let new_hunger_value = hunger.currentValue + 2;
        new_hunger_value = (new_hunger_value > hunger.effectiveMax)? hunger.effectiveMax:
        new_hunger_value;

        hunger.setCurrentValue(new_hunger_value);
        dimension.playSound("random.burp", player.location)
    },
    onPlayerBreak({brokenBlockPermutation:permutaion, dimension, block, player}) {
        if (permutaion.getState('cosmos:cheese_part_visibility') == 6) return
        const silk_touch = player.getComponent('equippable').getEquipment('Mainhand')
        ?.getComponent('enchantable')?.getEnchantment('silk_touch')
        if (!silk_touch) return
        dimension
        .getEntities({location: block.center(), maxDistance: 1, type: "minecraft:item"})
        .find(item => item.getComponent('minecraft:item').itemStack.typeId == "cosmos:cheese_block")
        ?.kill()
    }
}

export const arc_lamp = {
    onRedstoneUpdate({block, powerLevel}) {
        if (powerLevel) block.setPermutation(block.permutation.withState('cosmos:lamp_active', false))
        else block.setPermutation(block.permutation.withState('cosmos:lamp_active', true))
    }
}

export const fallen_meteor = {
    onTick({block, dimension}){
        if(system.currentTick % 5000 == 0 && block.permutation.getState("cosmos:heat_level") == 1){
            block.setPermutation(block.permutation.withState("cosmos:heat_level", 0));
        }
        if(system.currentTick % 5 == 0 && dimension.isChunkLoaded(block.location) && block.permutation.getState("cosmos:heat_level")){
            let {x, y, z} = block.center();
            let burned_entity = dimension.getEntities({location: block.center(), maxDistance: 1})[0]
            if(!burned_entity) return;
            burned_entity.setOnFire(2, true);
            dimension.playSound("fire.fire", {x: x, y: y, z: z})
            for(let i = 0; i < 8; i++){
                dimension.spawnParticle('minecraft:basic_smoke_particle', {x: x + Math.random(), y: y + 0.2, z: z + Math.random()})
            }
            
            let direction_x =  x + 0.5 - burned_entity.location.x;
            let direction_z;

            for (direction_z = burned_entity.location.z - z; direction_x * direction_x + direction_z * direction_z < 0.0001; direction_z = (Math.random() - Math.random()) * 0.01)
            {
                direction_x = (Math.random() - Math.random()) * 0.01;
            }
            try{burned_entity.applyKnockback({x: direction_x, z: direction_z}, 1)}catch{}
        }
    }
}