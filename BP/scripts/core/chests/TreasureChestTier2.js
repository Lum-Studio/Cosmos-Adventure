import { world, system, MinecraftDimensionTypes } from "@minecraft/server";
import { TaskQueue } from "../../api/libraries/EndlessDB.js";
import { ChestUtils } from "../../api/libraries/ChestUtils.js"


world.beforeEvents.playerInteractWithEntity.subscribe((e) => {
    const { target: entity } = e;
    if (entity.typeId !== "cosmos:treasure_chest_tier2") {
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
        const chestEntity = dimension.spawnEntity("cosmos:treasure_chest_tier2", fixedLocation);
        chestEntity.nameTag = 'treasure_chest';
    }
});

const taskQueue = new TaskQueue();

const dimensions = [
    MinecraftDimensionTypes.overworld,
    MinecraftDimensionTypes.nether,
    MinecraftDimensionTypes.theEnd,
];

const enqueueTasks = () => {
    // Clear the task queue before adding new tasks
    taskQueue.tasks = [];

    // Push tasks for each dimension
    for (const dimension of dimensions) {
        taskQueue.push(() => {
            const dim = world.getDimension(dimension);
            const entities = dim.getEntities({ type: "cosmos:treasure_chest_tier2" });

            // Process each chest entity
            for (const entity of entities) {
                if (entity) {
                    const utils = new ChestUtils(entity);
                    utils.close();
                    utils.drop();
                }
            }
        });
    }
};

// Start the task processing
enqueueTasks();
taskQueue.run(10); // Adjust the run count based on performance needs