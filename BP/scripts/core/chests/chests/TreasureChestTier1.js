import { world, system, MinecraftDimensionTypes } from "@minecraft/server";
import { ChestUtils } from "ChestUtils";
import { TaskQueue } from "../../../api/libraries/EndlessDB";

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
system.runInterval(() => {
    const dimensions = [
        MinecraftDimensionTypes.overworld,
        MinecraftDimensionTypes.nether,
        MinecraftDimensionTypes.theEnd,
    ];

    // Push tasks for each dimension
    for (const dimension of dimensions) {
        taskQueue.push(() => {
            const dim = world.getDimension(dimension);
            for (const entity of dim.getEntities({ type: "custom:chest_entity" })) {
                if (entity) {
                    const utils = new ChestUtils(entity);
                    utils.close();
                    utils.drop();
                }
            }
        });
    }

    // Start processing tasks
    taskQueue.run(5); // Adjust the run count based on performance needs
});