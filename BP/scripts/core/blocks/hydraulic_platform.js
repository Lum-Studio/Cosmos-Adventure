import { world, system, BlockPermutation, Block } from "@minecraft/server";

const { resolve } = BlockPermutation
const hydraulic_platform_permutaions = [
    resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 0, "cosmos:is_full": true }),
    resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 1, "cosmos:is_full": true }),
    resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 2, "cosmos:is_full": true }),
    resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 3, "cosmos:is_full": true })
];

function HydraulicPlatformMotion(player, loc, entity, effect) {
    system.runTimeout(() => {
        entity.addEffect(effect, 9999, { amplifier: 4, showParticles: false })
        let location = entity.getDynamicProperty("end");
        let playerSeat = player.dimension.spawnEntity('cosmos:player_seat', loc);
        player.teleport(playerSeat.location);
        playerSeat.getComponent('minecraft:rideable').addRider(player);
        let motion = system.runInterval(() => {
            if (!entity.isValid() || !playerSeat.isValid() || (effect == 'slow_falling') ? ((Math.abs(location.y - entity.location.y))) <= 0.2 : (Math.abs(entity.location.y - location.y)) <= 0.2) {
                let blockMotionStart = JSON.parse(entity.getDynamicProperty("blocksStart"));
                let blockMotionEnd = JSON.parse(entity.getDynamicProperty("blocksEnd"));
                blockMotionStart.forEach((element) => entity.dimension.getBlock(element).setPermutation(entity.dimension.getBlock(element).permutation.withState("cosmos:is_open", false)))
                blockMotionEnd.forEach((element) => entity.dimension.getBlock(element).setPermutation(entity.dimension.getBlock(element).permutation.withState("cosmos:is_open", false)))
                playerSeat?.clearVelocity();
                playerSeat?.getComponent('minecraft:rideable').ejectRider(player)
                playerSeat?.remove()
                entity?.remove()
                system.clearRun(motion)
                return;
            }
            if (playerSeat.isValid() && !playerSeat.getComponent('minecraft:rideable').getRiders()[0]) playerSeat.getComponent('minecraft:rideable').addRider(player);
            playerSeat.clearVelocity();
            playerSeat.applyImpulse({ x: 0, y: entity.getVelocity().y, z: 0 })

        }, 1)
    }, 2);
}


/**@param {Block} block  */
function getHydraulicPlatformBlock(block) {
    let blockH = {
        blockZero: [block.north(), block.west(), block.offset({ x: -1, y: 0, z: -1 })],
        blockOne: [block.west(), block.south(), block.offset({ x: -1, y: 0, z: 1 })],
        blockTwo: [block.north(), block.east(), block.offset({ x: 1, y: 0, z: -1 })],
        blockThree: [block.south(), block.east(), block.offset({ x: 1, y: 0, z: 1 })]
    }

    let bool = (boolBlock) => boolBlock.every((bBlock) => bBlock && bBlock.typeId === "cosmos:hydraulic_platform" && !bBlock.permutation.getState('cosmos:is_full'))
    if (bool(blockH.blockZero)) {
        blockH.blockZero[0].setPermutation(hydraulic_platform_permutaions[1]);
        blockH.blockZero[1].setPermutation(hydraulic_platform_permutaions[3]);
        blockH.blockZero[2].setPermutation(hydraulic_platform_permutaions[0]);
        return 0
    } else if (bool(blockH.blockOne)) {
        blockH.blockOne[0].setPermutation(hydraulic_platform_permutaions[0]);
        blockH.blockOne[1].setPermutation(hydraulic_platform_permutaions[2]);
        blockH.blockOne[2].setPermutation(hydraulic_platform_permutaions[3]);
        return 1
    } else if (bool(blockH.blockTwo)) {
        blockH.blockTwo[0].setPermutation(hydraulic_platform_permutaions[0]);
        blockH.blockTwo[1].setPermutation(hydraulic_platform_permutaions[2]);
        blockH.blockTwo[2].setPermutation(hydraulic_platform_permutaions[1]);
        return 2
    } else if (bool(blockH.blockThree)) {
        blockH.blockThree[0].setPermutation(hydraulic_platform_permutaions[3]);
        blockH.blockThree[1].setPermutation(hydraulic_platform_permutaions[1]);
        blockH.blockThree[2].setPermutation(hydraulic_platform_permutaions[2]);
        return 3
    }
}
function getPlatformBlocks(rot, block) {
    if (rot === 0) return [block.south(), block.east(), block.offset({ x: 1, y: 0, z: 1 })]
    else if (rot === 1) return [block.south(), block.west(), block.offset({ x: -1, y: 0, z: 1 })]
    else if (rot === 2) return [block.west(), block.north(), block.offset({ x: -1, y: 0, z: -1 })]
    else if (rot === 3) return [block.north(), block.east(), block.offset({ x: 1, y: 0, z: -1 })]
}
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cosmos:hydraulic_platform", {
        beforeOnPlayerPlace(event) {
            let getBl = '2130'[getHydraulicPlatformBlock(event.block)];
            event.permutationToPlace = hydraulic_platform_permutaions[getBl].withState("cosmos:is_main", true);
        },
        onPlayerDestroy(event) {
            if (event.destroyedBlockPermutation.getState('cosmos:is_full')) {
                let blockDestroyed = getPlatformBlocks(event.destroyedBlockPermutation.getState('cosmos:rotation'), event.block);
                const non_fullMain = hydraulic_platform_permutaions[0].withState("cosmos:is_full", false).withState("cosmos:is_main", false);
                blockDestroyed.forEach((element) => element.setPermutation(non_fullMain));
            }
        },
        onTick({ block, dimension }) {
            if (block.permutation.getState('cosmos:is_main')) {
                let blocks = getPlatformBlocks(block.permutation.getState('cosmos:rotation'), block)
                let { x, y, z } = block.center()
                let center = (block.permutation.getState('cosmos:rotation') === 0) ? { x: x + 0.5, y: y, z: z + 0.5 } :
                    (block.permutation.getState('cosmos:rotation') === 1) ? { x: x - 0.5, y: y, z: z + 0.5 } :
                        (block.permutation.getState('cosmos:rotation') === 2) ? { x: x - 0.5, y: y, z: z - 0.5 } :
                            (block.permutation.getState('cosmos:rotation') === 3) ? { x: x + 0.5, y: y, z: z - 0.5 } :
                                undefined;
                let players = dimension.getPlayers({ location: { x: center.x, y: center.y + 1, z: center.z }, maxDistance: 1 })
                if (players.length > 0) {
                    if (!block.permutation.getState('cosmos:is_selected')) {
                        block.setPermutation(block.permutation.withState('cosmos:is_selected', true))
                        blocks.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_selected', true)))
                    }
                    let blockUp = dimension.getBlockFromRay({ x: x, y: y + 1, z: z }, { x: 0, y: 1, z: 0 }, { maxDistance: 15 })?.block;
                    let blockDown = dimension.getBlockFromRay({ x: x, y: y - 1, z: z }, { x: 0, y: -1, z: 0 }, { maxDistance: 15 })?.block;
                    if (blockUp && blockUp.typeId == 'cosmos:hydraulic_platform' && blockUp.permutation.getState('cosmos:is_full') && blockUp.permutation.getState('cosmos:rotation') == block.permutation.getState('cosmos:rotation') && getPlatformBlocks(blockUp.permutation.getState('cosmos:rotation'), blockUp).every((element) => element.below().isAir != false)) {
                        if (players[0].isJumping) {
                            if (!block.permutation.getState('cosmos:is_open')) {
                                block.setPermutation(block.permutation.withState('cosmos:is_open', true))
                                blocks.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_open', true)))
                                let blocksUp = getPlatformBlocks(blockUp.permutation.getState('cosmos:rotation'), blockUp)
                                blockUp.setPermutation(blockUp.permutation.withState('cosmos:is_open', true))
                                blocksUp.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_open', true)))
                                let centerUp = (blockUp.permutation.getState('cosmos:rotation') === 0) ? { x: blockUp.center().x + 0.5, y: blockUp.center().y, z: blockUp.center().z + 0.5 } :
                                    (blockUp.permutation.getState('cosmos:rotation') === 1) ? { x: blockUp.center().x - 0.5, y: blockUp.center().y, z: blockUp.center().z + 0.5 } :
                                        (blockUp.permutation.getState('cosmos:rotation') === 2) ? { x: blockUp.center().x - 0.5, y: blockUp.center().y, z: blockUp.center().z - 0.5 } :
                                            (blockUp.permutation.getState('cosmos:rotation') === 3) ? { x: blockUp.center().x + 0.5, y: blockUp.center().y, z: blockUp.center().z - 0.5 } :
                                                undefined;
                                let platform = dimension.spawnEntity('cosmos:hydraulic_platform', { x: center.x, y: center.y + 0.3, z: center.z })
                                let blocksEdited = [blocks[0].location, blocks[1].location, blocks[2].location, block.location]
                                let blocksUpEdited = [blocksUp[0].location, blocksUp[1].location, blocksUp[2].location, blockUp.location]
                                platform.setDynamicProperty("blocksStart", JSON.stringify(blocksEdited))
                                platform.setDynamicProperty("blocksEnd", JSON.stringify(blocksUpEdited))
                                centerUp.y += 1
                                platform.setDynamicProperty("end", centerUp)
                                HydraulicPlatformMotion(players[0], players[0].location, platform, "levitation")
                            }
                        }
                    }
                    if (blockDown && blockDown.typeId == 'cosmos:hydraulic_platform' && blockDown.permutation.getState('cosmos:is_full') && blockDown.permutation.getState('cosmos:rotation') == block.permutation.getState('cosmos:rotation') && getPlatformBlocks(blockDown.permutation.getState('cosmos:rotation'), blockDown).every((element) => element.above().isAir != false)) {
                        if (players[0].isSneaking) {
                            if (!block.permutation.getState('cosmos:is_open')) {
                                block.setPermutation(block.permutation.withState('cosmos:is_open', true))
                                blocks.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_open', true)))
                                let blocksDown = getPlatformBlocks(blockDown.permutation.getState('cosmos:rotation'), blockDown)
                                blockDown.setPermutation(blockDown.permutation.withState('cosmos:is_open', true))
                                blocksDown.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_open', true)))
                                let centerDown = (blockDown.permutation.getState('cosmos:rotation') === 0) ? { x: blockDown.center().x + 0.5, y: blockDown.center().y, z: blockDown.center().z + 0.5 } :
                                    (blockDown.permutation.getState('cosmos:rotation') === 1) ? { x: blockDown.center().x - 0.5, y: blockDown.center().y, z: blockDown.center().z + 0.5 } :
                                        (blockDown.permutation.getState('cosmos:rotation') === 2) ? { x: blockDown.center().x - 0.5, y: blockDown.center().y, z: blockDown.center().z - 0.5 } :
                                            (blockDown.permutation.getState('cosmos:rotation') === 3) ? { x: blockDown.center().x + 0.5, y: blockDown.center().y, z: blockDown.center().z - 0.5 } :
                                                undefined;
                                let platform = dimension.spawnEntity('cosmos:hydraulic_platform', { x: center.x, y: center.y + 0.2, z: center.z })
                                let blocksEdited = [blocks[0].location, blocks[1].location, blocks[2].location, block.location]
                                let blocksDownEdited = [blocksDown[0].location, blocksDown[1].location, blocksDown[2].location, blockDown.location]
                                platform.setDynamicProperty("blocksStart", JSON.stringify(blocksEdited))
                                platform.setDynamicProperty("blocksEnd", JSON.stringify(blocksDownEdited))
                                platform.setDynamicProperty("end", { x: centerDown.x, y: centerDown.y - 1.4, z: centerDown.z })
                                HydraulicPlatformMotion(players[0], { x: players[0].location.x, y: players[0].location.y, z: players[0].location.z }, platform, "slow_falling")
                            }
                        }
                    }
                } else if (players.length === 0) {
                    if (block.permutation.getState('cosmos:is_selected')) {
                        block.setPermutation(block.permutation.withState('cosmos:is_selected', false))
                        blocks.forEach((element) => element.setPermutation(element.permutation.withState('cosmos:is_selected', false)))
                    }
                }
            }
        }
    })
})
