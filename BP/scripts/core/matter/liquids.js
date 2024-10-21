import { world, BlockPermutation } from "@minecraft/server"

function evaporate(block) {
    const liquid = block.permutation
    const height = liquid.getState("cosmos:height")
    const source = liquid.getState("cosmos:source")
    if (source) return
    if (height == 1) block.setType("minceaft:air")
    else block.setPermutation(liquid.withState('cosmos:height', height - 1))
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("cosmos:liquid", {
        onTick({block, dimension}){
            const liquid = block.permutation
            const height = liquid.getState("cosmos:height")
            const source = liquid.getState("cosmos:source")
            
            const neighbors = [block.north(), block.east(), block.south(), block.west()]
            const has_source = block.permutation.getState('cosmos:source') || neighbors.find(side => {
                const higher = side.typeId == block.typeId && source_height <= side.permutation?.getState('cosmos:height')
                return side.permutation?.getState('cosmos:source') || higher
            })
            if (!has_source) evaporate(block)
            for (const [i, side] of neighbors.entries()) {
                const side_height = side?.permutaion?.getState('cosmos:height')
                const can_flow = (side_height < source_height || side.typeId == "minecraft:air") && source_height > 1
                if (!can_flow || has_source) continue
                dimension.setBlockPermutation(side.location, block.permutation.withState("cosmos:height", source_height - 1).withState("cosmos:source", false))
            }
        }
    });
})