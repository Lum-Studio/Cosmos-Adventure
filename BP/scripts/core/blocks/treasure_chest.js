import { world, system } from "@minecraft/server";
import { TaskQueue } from "../../api/libraries/EndlessDB.js";
import { ChestUtils } from "../../api/libraries/ChestUtils.js";

const tiers = {
    "cosmos:tier1_key": "cosmos:tier1_treasure_chest",
    "cosmos:tier2_key": "cosmos:tier2_treasure_chest",
    "cosmos:tier3_key": "cosmos:tier3_treasure_chest",
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:treasure_chest', {
        onPlayerInteract({block, player, dimension}) {
            const chest = block.permutation
            const equipment = player.getComponent("minecraft:equippable")
            const item = equipment.getEquipment("Mainhand")
            if (chest.getState('cosmos:chest_state') != 'locked') return
            if (tiers[item?.typeId] != block.typeId) return
            const tier = Object.keys(tiers).indexOf(item)
            block.setPermutation(chest.withState('cosmos:chest_state', 'unlocked'))
            dimension.spawnEntity("cosmos:treasure_chest", block.center())
            if (player.getGameMode() != 'creative') player.runCommand(`clear @s ${item.typeId} 0 1`)
        },
        onPlayerDestroy({block, destroyedBlockPermutation:chest}) {
            null
        }
    })
})

world



world.beforeEvents.playerInteractWithEntity.subscribe((e) => {
    const { target: entity } = e;
    if (entity.typeId !== "cosmos:treasure_chest_tier1") {
        return;
    }
    system.run(() => {
        new ChestUtils(entity).open();
    });
});

world.afterEvents.playerPlaceBlock.subscribe((e) => {
    const block = e.block;
    const { dimension, location: loc } = block;
    const fixedLocation = { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 };
    
    if (block.hasTag("treasure_chest")) {
        const chestEntity = dimension.spawnEntity("cosmos:treasure_chest_tier1", fixedLocation);
        chestEntity.nameTag = 'treasure_chest';
    }
});

const taskQueue = new TaskQueue();



const enqueueTasks = () => {
    // Clear the task queue before adding new tasks
    taskQueue.tasks = [];

    // Push tasks for each dimension
    // for (const dimension of alldimensions) {
    //     taskQueue.push(() => {
    //         const dim = world.getDimension(dimension);
    //         const entities = dim.getEntities({ type: "cosmos:treasure_chest_tier1" });

    //         // Process each chest entity
    //         for (const entity of entities) {
    //             if (entity) {
    //                 const utils = new ChestUtils(entity);
    //                 utils.close();
    //                 utils.drop();
    //             }
    //         }
    //     });
    // }
};

// Start the task processing
enqueueTasks();
taskQueue.run(10); // Adjust the run count based on performance needs

world.beforeEvents.playerInteractWithEntity