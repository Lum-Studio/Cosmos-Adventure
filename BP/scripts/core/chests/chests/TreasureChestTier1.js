import { world, system, MinecraftDimensionTypes } from "@minecraft/server";
import { ChestUtils } from "ChestUtils";
world.beforeEvents.playerInteractWithEntity.subscribe((e) => {
    const { target: entity } = e;
    if (entity.typeId !== "custom:chest_entity")
        return;
    system.run(() => {
        new ChestUtils(entity).open();
    });
});
world.afterEvents.playerPlaceBlock.subscribe((e) => {
    const block = e.block;
    const { dimension, location: loc } = block;
    const fixedLocation = { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 };
    if (block.hasTag("custom_chest") || block.hasTag("custom_barrel")) {
        const chestEntity = dimension.spawnEntity("custom:chest_entity", fixedLocation);
        block.hasTag('custom_chest') ? chestEntity.nameTag = 'Chest' : chestEntity.nameTag = 'Barrel';
    }
});
system.runInterval(() => {
    const dimensions = [
        MinecraftDimensionTypes.overworld,
        MinecraftDimensionTypes.nether,
        MinecraftDimensionTypes.theEnd,
    ];
    for (const dimension of dimensions) {
        const dim = world.getDimension(dimension);
        for (const entity of dim.getEntities({ type: "custom:chest_entity" })) {
            if (entity) {
                const utils = new ChestUtils(entity);
                utils.close();
                utils.drop();
            }
        }
    }
});
