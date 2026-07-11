import { world } from "@minecraft/server"

export const volcanic_pickaxe_component = {
    onMineBlock({ source, block, itemStack: item}) {
        if(source.getGameMode() == "Creative") return;
        let {x, y, z} = block.location;
        const sides = {
            "face_0": {x: x-1, y: y, z: z-1, x1: x+1, y1: y, z1: z+1},
            "face_1": {x: x, y: y-1, z: z-1, x1: x, y1: y+1, z1: z+1},
            "face_2": {x: x-1, y: y-1, z: z, x1: x+1, y1: y+1, z1: z}
        }
        let direction = source.getViewDirection();
        let face = "face_0";
        if(Math.abs(direction.y) > 0.8) face = "face_0"
        else if(Math.abs(direction.x) > 0.5) face = "face_1"
        else if(Math.abs(direction.z) > 0.5) face = "face_2"

        const exluded_blocks = ["minecraft:bedrock", "minecraft:water", "minecraft:lava"]

        for(let xb = sides[face].x; xb <= sides[face].x1; xb++){
            for(let zb = sides[face].z; zb <= sides[face].z1; zb++){
                for(let yb = sides[face].y; yb <= sides[face].y1; yb++){
                    let dest_block = block.dimension.getBlock({x: xb, y: yb, z: zb});
                    if(yb > block.dimension.heightRange.max || yb < block.dimension.heightRange.min || exluded_blocks.includes(dest_block.typeId)) continue;
                    block.dimension.runCommand(`fill ${xb} ${yb} ${zb} ${xb} ${yb} ${zb} air destroy`)
                }
            }
        }

        let durability = item.getComponent("minecraft:durability");
        durability.damage = Math.min(durability.damage + Math.random() * 50, durability.maxDurability);
        if(durability.damage === durability.maxDurability) item = undefined;
        source.getComponent('equippable').setEquipment('Mainhand', item);
    }
}