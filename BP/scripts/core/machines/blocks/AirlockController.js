import * as mc from "@minecraft/server";
import { load_dynamic_object, save_dynamic_object } from "../../../api/utils";

const data = {
    ui: "§a§i§r§l§o§c§k§_§c§o§n§t§r§o§l§l§e§r",
    onPlace(entity, block, event) {
        let ownerName = "";
        if (event && event.player) {
            ownerName = event.player.name;
        }
        
        save_dynamic_object(entity, {
            ownerName: ownerName,
            redstoneActivation: 0,
            playerDistanceActivation: 0,
            playerDistanceSelection: 2,
            ownerOnly: false,
            invertSelection: false,
            horizontalModeEnabled: false,
        }, "machine_data");
    },
    onTick(entity, block) {
        const vars = load_dynamic_object(entity, "machine_data");
        let redstoneActivation = vars.redstoneActivation ?? 0;
        let playerDistanceActivation = vars.playerDistanceActivation ?? 0;
        let playerDistanceSelection = vars.playerDistanceSelection ?? 2;
        let ownerOnly = vars.ownerOnly ?? false;
        let invertSelection = vars.invertSelection ?? false;
        let horizontalModeEnabled = vars.horizontalModeEnabled ?? false;
        const ownerName = vars.ownerName ?? "";
        
        const container = entity.getComponent('minecraft:inventory').container;

        if (container.was_ui_clicked(0, entity)) { redstoneActivation = (redstoneActivation + 1) % 3; }
        if (container.was_ui_clicked(1, entity)) { playerDistanceActivation = (playerDistanceActivation + 1) % 3; }
        if (container.was_ui_clicked(2, entity)) { playerDistanceSelection = (playerDistanceSelection + 1) % 4; }
        if (container.was_ui_clicked(3, entity)) { ownerOnly = !ownerOnly; }
        if (container.was_ui_clicked(4, entity)) { invertSelection = !invertSelection; }
        if (container.was_ui_clicked(5, entity)) { horizontalModeEnabled = !horizontalModeEnabled; }

        save_dynamic_object(entity, {
            ownerName: ownerName,
            redstoneActivation: redstoneActivation,
            playerDistanceActivation: playerDistanceActivation,
            playerDistanceSelection: playerDistanceSelection,
            ownerOnly: ownerOnly,
            invertSelection: invertSelection,
            horizontalModeEnabled: horizontalModeEnabled,
        }, "machine_data");

        const redstonePower = block.getRedstonePower ? block.getRedstonePower() : 0;
        const redstoneActive = redstonePower > 0;
        
        let playerInRange = false;
        if (playerDistanceActivation !== 0) {
            const players = entity.dimension.getPlayers({ location: block.location, maxDistance: playerDistanceSelection });
            if (ownerOnly) {
                playerInRange = players.some(p => p.name === ownerName);
            } else {
                playerInRange = players.length > 0;
            }
        }
        
        let openCount = 0;
        let closeCount = 0;

        if (redstoneActivation === 1) {
            if (redstoneActive) openCount++; else closeCount++;
        } else if (redstoneActivation === 2) {
            if (redstoneActive) closeCount++; else openCount++;
        }

        if (playerDistanceActivation === 1) {
            if (playerInRange) openCount++; else closeCount++;
        } else if (playerDistanceActivation === 2) {
            if (playerInRange) closeCount++; else openCount++;
        }

        let open = (openCount > 0); 
        if (invertSelection) open = !open;

        const active = !open; // active means SEALED
        
        // Trace airlock frame
        const bounds = traceAirlock(block, horizontalModeEnabled);
        
        // Update blocks
        if (bounds) {
            fillAirlock(entity.dimension, bounds, active);
        }
        
        // Redraw UI toggles with labels
        const redstoneText = redstoneActivation === 0 ? "Redstone: Ignore" : (redstoneActivation === 1 ? "Redstone: Opens" : "Redstone: Closes");
        const distText = playerDistanceActivation === 0 ? "Distance: Ignore" : (playerDistanceActivation === 1 ? "Distance: Opens" : "Distance: Closes");
        const distVal = playerDistanceSelection === 0 ? "Within 1m" : (playerDistanceSelection === 1 ? "Within 2m" : (playerDistanceSelection === 2 ? "Within 5m" : "Within 10m"));
        
        function setToggle(container, slot, isOn, text) {
            const item = new (mc.ItemStack)('cosmos:ui_button');
            const dur = item.getComponent('durability');
            if (dur) dur.damage = isOn ? dur.maxDurability - 1 : dur.maxDurability;
            item.nameTag = text;
            container.setItem(slot, item);
        }

        setToggle(container, 0, redstoneActivation !== 0, redstoneText);
        setToggle(container, 1, playerDistanceActivation !== 0, distText);
        setToggle(container, 2, true, distVal);
        setToggle(container, 3, ownerOnly, ownerOnly ? "Open for Owner" : "Open for Any");
        setToggle(container, 4, invertSelection, invertSelection ? "Inverted: Yes" : "Inverted: No");
        setToggle(container, 5, horizontalModeEnabled, horizontalModeEnabled ? "Horizontal" : "Vertical");
        
        const statusItem = new mc.ItemStack('cosmos:ui_button');
        statusItem.nameTag = active ? "§cAir Lock Closed" : "§aAir Lock Open";
        container.setItem(6, statusItem);
    }
};

function traceAirlock(startBlock, horizontalModeEnabled) {
    const visited = new Set();
    const queue = [startBlock];
    
    let minX = startBlock.location.x;
    let maxX = startBlock.location.x;
    let minY = startBlock.location.y;
    let maxY = startBlock.location.y;
    let minZ = startBlock.location.z;
    let maxZ = startBlock.location.z;
    
    visited.add(`${startBlock.location.x},${startBlock.location.y},${startBlock.location.z}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        minX = Math.min(minX, current.location.x);
        maxX = Math.max(maxX, current.location.x);
        minY = Math.min(minY, current.location.y);
        maxY = Math.max(maxY, current.location.y);
        minZ = Math.min(minZ, current.location.z);
        maxZ = Math.max(maxZ, current.location.z);
        
        const dirs = [
            {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
            {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0},
            {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}
        ];
        
        for (const dir of dirs) {
            const nx = current.location.x + dir.x;
            const ny = current.location.y + dir.y;
            const nz = current.location.z + dir.z;
            const key = `${nx},${ny},${nz}`;
            
            if (!visited.has(key)) {
                if (Math.abs(nx - startBlock.location.x) > 20 || 
                    Math.abs(ny - startBlock.location.y) > 20 || 
                    Math.abs(nz - startBlock.location.z) > 20) {
                    continue;
                }
                
                try {
                    const block = startBlock.dimension.getBlock({x: nx, y: ny, z: nz});
                    if (block && (block.typeId === "cosmos:airlock_frame" || block.typeId === "cosmos:airlock_controller")) {
                        visited.add(key);
                        queue.push(block);
                    }
                } catch (e) {}
            }
        }
    }
    
    let sizeX = maxX - minX + 1;
    let sizeY = maxY - minY + 1;
    let sizeZ = maxZ - minZ + 1;
    
    if (horizontalModeEnabled) {
        if (sizeX >= 3 && sizeZ >= 3 && sizeY === 1) {
            return {
                minX: minX + 1, maxX: maxX - 1,
                minY: minY, maxY: maxY,
                minZ: minZ + 1, maxZ: maxZ - 1
            };
        }
    } else {
        if (sizeX >= 3 && sizeY >= 3 && sizeZ === 1) {
            return {
                minX: minX + 1, maxX: maxX - 1,
                minY: minY + 1, maxY: maxY - 1,
                minZ: minZ, maxZ: maxZ
            };
        } else if (sizeZ >= 3 && sizeY >= 3 && sizeX === 1) {
            return {
                minX: minX, maxX: maxX,
                minY: minY + 1, maxY: maxY - 1,
                minZ: minZ + 1, maxZ: maxZ - 1
            };
        }
    }
    
    return null;
}

function fillAirlock(dimension, bounds, active) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
                try {
                    const block = dimension.getBlock({x, y, z});
                    if (block) {
                        if (active) {
                            if (block.typeId === "minecraft:air" || block.typeId === "cosmos:airlock_seal") {
                                if (block.typeId !== "cosmos:airlock_seal") {
                                    block.setType("cosmos:airlock_seal");
                                }
                            }
                        } else {
                            if (block.typeId === "cosmos:airlock_seal") {
                                block.setType("minecraft:air");
                            }
                        }
                    }
                } catch (e) {}
            }
        }
    }
}

export default data;
