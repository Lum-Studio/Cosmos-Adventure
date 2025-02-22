import { world, system } from "@minecraft/server";
import machines from "./AllMachineBlocks";
import { detach_wires, attach_to_wires } from "../blocks/aluminum_wire"
import { pickaxes } from "../../api/utils"

export let machine_entities = new Map();

function clean_machine_entities(machines_array) {
    for (let machine of machines_array.entries()) {
        let entity, block;
        if (!(entity = world.getEntity(machine[0])) || !(block = entity?.dimension.getBlock(machine[1].location))) {
            continue;
        }
        new machines[machine[1].type].class(entity, block);
    }
}

{
    const query = { maxDistance: 6, families: ["cosmos"] }
    var block_entity_access = () => {
        for (const player of world.getAllPlayers()) {
            if (player.isSneaking) {
                player.getEntitiesFromViewDirection(query)[0]?.entity?.triggerEvent("cosmos:shrink");
                continue;
            }
            const hand = player.hand();
            if (!hand.hasItem() || !pickaxes.has(hand.typeId) || hand.typeId !== "cosmos:standard_wrench") continue;
            player.getEntitiesFromViewDirection(query)[0]?.entity?.triggerEvent("cosmos:shrink");
        }
    }
    system.runInterval(() => {
        if (!machine_entities.size) return;
        if (system.currentTick % 2) block_entity_access();
        clean_machine_entities(machine_entities);
    }, 1);
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:machine', {
        beforeOnPlayerPlace(event) {
            const { block, permutationToPlace: perm } = event
            const machine_name = perm.type.id.replace('cosmos:', '')
            const machine_object = machines[machine_name]
            const machineEntity = block.dimension.spawnEntity(perm.type.id, block.bottomCenter());
            machineEntity.nameTag = machine_object.ui;
            new machine_object.class(machineEntity, block).onPlace();
            machine_entities.set(machineEntity.id, { type: machine_name, location: block.location })
            if (perm.getState("cosmos:full")) event.permutationToPlace = perm.withState("cosmos:full", false); //this is for energy stores.
            system.run(() => attach_to_wires(block));
        },
        onPlayerDestroy({ block, dimension, destroyedBlockPermutation: perm }) {
            detach_wires(block);
            const machineEntity = dimension.getEntities({
                type: perm.type.id,
                location: {
                    x: Math.floor(block.location.x) + 0.5,
                    y: Math.floor(block.location.y) + 0.5,
                    z: Math.floor(block.location.z) + 0.5,
                },
                maxDistance: 0.5,
            })[0];
            // check if the entity exists
            if (!machineEntity) return
            machine_entities.delete(machineEntity.id);
            //clear the ui items before killing the entity
            const container = machineEntity.getComponent('minecraft:inventory')?.container
            if (container) {
                for (let i = 0; i < container.size; i++) {
                    const itemId = container.getItem(i)?.typeId
                    if (!['cosmos:ui', 'cosmos:ui_button'].includes(itemId)) continue
                    container.setItem(i)
                }
            }
            machineEntity?.runCommand('kill @s');
            machineEntity?.remove();
        },
    });
});

world.afterEvents.entityLoad.subscribe(({ entity }) => {
    const machine_name = entity.typeId.replace('cosmos:', '')
    if (!Object.keys(machines).includes(machine_name)) return
    if (machine_entities.has(entity.id)) return;
    const block = entity.dimension.getBlock(entity.location);
    if (block.typeId != entity.typeId) {
        machine_entities.delete(entity.id)
        entity.remove();
        return;
    }
    new machines[machine_name].class(entity, block);
    machine_entities.set(entity.id, { type: machine_name, location: block.location });
});

world.afterEvents.worldInitialize.subscribe(() => {
    world.getDims(dimension => dimension.getEntities()).forEach(entity => {
        const machine_name = entity.typeId.replace('cosmos:', '')
        if (!Object.keys(machines).includes(machine_name)) return
        const block = entity.dimension.getBlock(entity.location);
        if (block.typeId != entity.typeId) {
            machine_entities.delete(entity.id)
            entity.remove();
            return;
        }
        new machines[machine_name].class(entity, block);
        machine_entities.set(entity.id, { type: machine_name, location: block.location });
    })
})
