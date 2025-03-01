import { world, system } from "@minecraft/server";

import { world, system, Block, Dimension,  } from "@minecraft/server"
export { BlockUpdate }

const Events = {}
const Offsets =  [{ x: 0, y: 0, z: 0 },{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0},{ x: 0, y: 1, z: 0}, { x: 0, y: -1, z: 0}, { x: 0, y: 0, z: 1},{ x: 0, y: 0, z: -1 }]
let LastEventId = -1
class BlockUpdate {
    constructor(data) {
        this.#block = data.block
        this.#source = data.source
    }
    #source
    #block

    /**
     * The block that was updated
     * @returns {Block}
     */
    get block() {
        return this.#block
    }

    /**
     * The block that triggered the update of this block
     * @returns {Block | undefined} 
     */
    get source() {
        return this.#source
    }



    /**
     * Creates a new block update listener
     * @param {Function<BlockUpdate>} callback callback function that takes a BlockUpdate object
     * @returns {String} listener ID used for BlockUpdate.off
     */
    static on(callback) {
        LastEventId++
        Events[LastEventId + ''] = callback
        return LastEventId + ''
    }

    /**
     * Deletes the listener with this ID
     * @param {String} id 
     */
    static off(id) {
        delete Events[id]
    }

    /**
     * Simulates block update and trigger events for all blocks around
     * @param {Block} source 
     */
    static trigger(source) {
        for (let offset of Offsets) {
            let block;
            try {
                block = source.offset(offset)
            } catch {}
            if (block != undefined) BlockUpdate.triggerEvents({ source: source, block: block });
        }
    }

    /**
     * Simulates events when updating ONE block
     * @param {Object} data
     * @param {Block} data.block
     * @param {Block | undefined} data.source 
     */
    static triggerEvents(data) {
        const update = new BlockUpdate(data)
        for (let callback of Object.values(Events)) {
            callback(update)
        }
    }
}

function easyTrigger(data) {
    BlockUpdate.trigger(data.block)
}
world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    if (!data.isFirstEvent) return;
    system.run(() => {
        if (!data.block.isValid() || data.cancel) return;
        BlockUpdate.trigger(data.block)
    })
})
world.afterEvents.playerBreakBlock.subscribe(easyTrigger)
world.afterEvents.buttonPush.subscribe(easyTrigger)
world.afterEvents.explosion.subscribe(data => {
    let triggeredBlocks = []
    for (let block of data.getImpactedBlocks()) {
        triggeredBlocks.push(block)
    }
    
    const length = triggeredBlocks.length
    for (let index = 0; index < length; index++) {
        const source = triggeredBlocks[index]
        BlockUpdate.triggerEvents({ block: source })
        for (let offset of Offsets) {
            let block;
            try { block = source.offset(offset) } catch {};

            if (block != undefined && !triggeredBlocks.includes(block)) {
                triggeredBlocks.push(block)
                BlockUpdate.triggerEvents({ block: block, source: source });
            }
        }
    }
})
world.afterEvents.leverAction.subscribe(easyTrigger)
world.afterEvents.pistonActivate.subscribe(easyTrigger)
world.afterEvents.playerPlaceBlock.subscribe(easyTrigger)
world.afterEvents.pressurePlatePop.subscribe(easyTrigger)
world.afterEvents.pressurePlatePush.subscribe(easyTrigger)
world.afterEvents.projectileHitBlock.subscribe(data => {
    BlockUpdate.trigger(data.getBlockHit().block)
})
world.afterEvents.tripWireTrip.subscribe(easyTrigger)

const OriginalMethods = [
    { 
        class: Block, 
        name: 'setType' 
    },
    {
        class: Block,
        name: 'setPermutation'
    },
    {
        class: Block,
        name: 'setWaterlogged'
    },
    {
        class: Dimension,
        name: 'setBlockType'
    },
    {
        class: Dimension,
        name: 'setBlockPermutation'
    }
]

for (let data of OriginalMethods) {
    data.method = data.class.prototype[data.name]

    data.class.prototype[data.name] = function (arg1, arg2) {
        

        if (this instanceof Dimension) {
            data.method.bind(this)(arg1, arg2)
            let block = this.getBlock(arg1)
            if (block != undefined) {
                BlockUpdate.trigger(block)
            }
        } else {
            data.method.bind(this)(arg1)
            BlockUpdate.trigger(this)
        }   
    }
}




// Example
BlockUpdate.on(data => {
    data.block.dimension.spawnParticle('minecraft:villager_happy', data.block.above().center())
})