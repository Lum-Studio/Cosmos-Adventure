import { ItemStack, system, world } from "@minecraft/server"
import { select_solar_system } from "./player/celestial_selector";
import nasa_workbench_recipes from "../recipes/nasa_workbench";

system.beforeEvents.startup.subscribe(({customCommandRegistry, itemComponentRegistry, blockComponentRegistry}) => {
    // Commands
    customCommandRegistry.registerCommand({
        name: "cosmos:render_distance", 
        description: "Changes the Script Render Distance", 
        cheatsRequired: false, permissionLevel: 1,
        mandatoryParameters: [{ type: "Integer", name: "chunks" }]
    }, 
    ({sourceType, sourceEntity}, chunks) => {
        if(sourceType == "Entity" && sourceEntity.typeId == "minecraft:player") {
            world.setDynamicProperty("render_distance", chunks);
        }
    })

    customCommandRegistry.registerCommand({
        name: "cosmos:celestial_selector",
        description: "Opens the Celestial Selector screen.",
        cheatsRequired: true, permissionLevel: 1
    }, 
    ({sourceType, sourceEntity}) => {
        if (sourceType == "Entity" && sourceEntity.typeId == "minecraft:player") {
            system.run(() => select_solar_system(sourceEntity, 3, true))
        }
    })

    customCommandRegistry.registerEnum('cosmos:vehicle', Object.keys(nasa_workbench_recipes))
    customCommandRegistry.registerCommand({
        name: "cosmos:get_vehicle",
        description: "Gives a rocket or a vehicle with an inventory.",
        cheatsRequired: true, permissionLevel: 1,
        mandatoryParameters: [
            { type: "Enum", name: "cosmos:vehicle" }
        ],
        optionalParameters: [
            { type: "Integer", name: "storage tier" }
        ]
    }, 
	({sourceType, sourceEntity: player}, rocket_type, storage_size = 0) => {
		if (sourceType != "Entity" || player.typeId != "minecraft:player") return
        if (storage_size < 0 || storage_size > 3) { player.sendMessage('§cStorage Space must be 0-3'); return }
        if (rocket_type == "cosmos:cargo_rocket_item" && storage_size != 0) { player.sendMessage('§cCargo storage size must be 0'); return }
        storage_size *= 18
        const inventory = player.getComponent('inventory').container
        const rocket = new ItemStack(rocket_type)
        system.run(() => {
            if (storage_size > 0) {
                rocket.setLore([`§r§7Storage Space: ${storage_size}`])
                rocket.setDynamicProperty("inventory_size", storage_size)
            }
            inventory.addItem(rocket)
        })
	})
})