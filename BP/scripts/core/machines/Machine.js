import {world, system} from "@minecraft/server";
import machines from "./AllMachineBlocks";
import { detach_wires, attach_to_wires } from "../blocks/aluminum_wire"
import { compare_position } from "../matter/electricity"
import { pickaxes } from "../../api/utils"

export let machine_entities = new Map();

function machines_enumeration(machines_array){
    for(let machine of machines_array){
        let machine_entity = world.getEntity(machine);
        if(!machine_entity){
            machine_entities.delete(machine);
            return;
        }
        let machine_block = machine_entity.dimension.getBlock(machine_entity.getDynamicProperty("block_location"));
        block_entity_access(machine_block, machine_entity);
		new machines[machine_entity.typeId.replace('cosmos:machine:', '')].class(machine_block, machine_entity);
    }
}
function block_entity_access(block, entity) {
	block.dimension.getPlayers({ location: block.center(), maxDistance: 6 }).forEach(player => {
		const view_block = player.getBlockFromViewDirection()?.block
		if (!compare_position(block?.location, view_block?.location)) return
		const sneaking = player.isSneaking
		const item = player.getComponent("minecraft:equippable").getEquipment("Mainhand")?.typeId
		const has_pickaxe = pickaxes.has(item)
		const has_wrench = item == "cosmos:standard_wrench"
		if (sneaking || has_pickaxe || has_wrench) entity.triggerEvent("cosmos:shrink")
	})
}
system.runInterval(() => {
    machines_enumeration(machine_entities.keys());
}, 1);
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('cosmos:machine', {
		beforeOnPlayerPlace({block, permutationToPlace: perm}){
            const machineEntity = block.dimension.spawnEntity(perm.type.id.replace("cosmos", "cosmos:machine"), { ...block.center(), y: block.y });
            machineEntity.setDynamicProperty("block_location", block.location);
            let machineType = machines[block.typeId.replace('cosmos:', '')];
            machineEntity.nameTag = machines[perm.type.id.replace('cosmos:', '')].ui;
            new machines[perm.type.id.replace('cosmos:', '')].class(block, machineEntity).onPlace();
            machine_entities.set(machineEntity.id, undefined);
            if(perm.getState("cosmos:full")) perm = perm.withState("cosmos:full", false);
            system.run(() => attach_to_wires(block));
        },
        onPlayerDestroy({block, dimension, destroyedBlockPermutation}){
            detach_wires(block);
            const machineEntity = dimension.getEntities({
                type: destroyedBlockPermutation.type.id.replace("cosmos", "cosmos:machine"),
                location: {
                    x: Math.floor(block.location.x) + 0.5,
                    y: Math.floor(block.location.y) + 0.5,
                    z: Math.floor(block.location.z) + 0.5,
                },
                maxDistance: 0.5,
            })[0];
			machine_entities.delete(machineEntity.id);
            // check if the entity exists
			if(!machineEntity) return
			//clear the ui items before killing the entity
			const container = machineEntity.getComponent('minecraft:inventory')?.container
			if (container) { for (let i = 0; i < container.size; i++) {
				const itemId = container.getItem(i)?.typeId
				if (!['cosmos:ui', 'cosmos:ui_button'].includes(itemId)) continue
				container.setItem(i)
			}}
            machineEntity?.runCommand('kill @s');
			machineEntity?.remove();
        },
    });
});

world.afterEvents.entityLoad.subscribe(({entity}) => {
    if(!entity.typeId.startsWith('cosmos:machine:')) return;
	if(machine_entities.has(entity.id)) return;
	const block = entity.dimension.getBlock(entity.location);
	if (block.typeId != entity.typeId.replace('cosmos:machine:', 'cosmos:')){
        machine_entities.delete(entity.id)
        entity.remove();
        return;
    }
    new machines[entity.typeId.replace('cosmos:machine:', '')].class(block, entity);
	machine_entities.set(entity.id, undefined);
});

world.afterEvents.worldInitialize.subscribe(() => {
	world.getDims((dimension) => dimension.getEntities()).forEach(entity => {
		if (!entity.typeId.startsWith('cosmos:machine:')) return;
        if(machine_entities.has(entity.id)) return;
        const block = entity.dimension.getBlock(entity.location);
        if(block.typeId != entity.typeId.replace('cosmos:machine:', 'cosmos:')){
            machine_entities.delete(entity.id)
            entity.remove();
            return;
        }
        new machines[entity.typeId.replace('cosmos:machine:', '')].class
        machine_entities.set(entity.id, undefined);
	})
})