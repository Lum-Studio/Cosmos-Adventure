import { world, system } from "@minecraft/server";

export function oxygen_spending(players){
    players.forEach(player => {
        let space_gear = JSON.parse(player.getDynamicProperty("space_gear") ?? '{}');
        let tank1 = space_gear["tank1"]?.split(' ')
        let tank2 = space_gear["tank2"]?.split(' ')
        
        //if (no tank1 or tank1 is empty and no tank2) or tank2 is empty or no mask or no gear
        if(((!tank1 || tank1[1] == "0") && (!tank2 || tank2[1] == "0")) || (!space_gear["mask"] || !space_gear["gear"])){
            oxygen_hunger(player);
            return;
        };
        
        if(tank1 && tank1[1] !== "0"){
            space_gear["tank1"] = tank1[0] + ' ' + Math.max(0, tank1[1] - 1);
            player.setDynamicProperty("space_gear", JSON.stringify(space_gear));
            if(player.getDynamicProperty("secondInventoryEntity")){
                let space_gear_entity = world.getEntity(player.getDynamicProperty("secondInventoryEntity")).getComponent("inventory").container;
                let new_tank = space_gear_entity.getItem(4);
                space_gear_entity.setItem(4, update_tank(new_tank, Math.max(0, tank1[1] - 1)))
            }
        }else if(tank2 && tank2[1] !== "0"){
            space_gear["tank2"] = tank2[0] + ' ' + Math.max(0, tank2[1] - 1);
            player.setDynamicProperty("space_gear", JSON.stringify(space_gear));
            if(player.getDynamicProperty("secondInventoryEntity")){
                let space_gear_entity = world.getEntity(player.getDynamicProperty("secondInventoryEntity")).getComponent("inventory").container;
                let new_tank = space_gear_entity.getItem(5);
                space_gear_entity.setItem(5, update_tank(new_tank, Math.max(0, tank2[1] - 1)))
            }
        }
        oxygen_bar(player, [tank1 ? tank1[1]: 0, tank2 ? tank2[1]: 0])
    });
}

function oxygen_hunger(player){
    player.addTag("oxygen_hunger");
    system.runTimeout(() => {
        let cycle = system.runInterval(() => {
            if(!player  || !player.isValid() || !player.hasTag("oxygen_hunger")){
                system.clearRun(cycle);
                return;
            }
            player.applyDamage(1);
           
            let space_gear = JSON.parse(player.getDynamicProperty("space_gear") ?? '{}');
            let tank1 = space_gear["tank1"]?.split(' ')
            let tank2 = space_gear["tank2"]?.split(' ')

            if(space_gear && ((tank1 && tank1[1] !== "0") || (tank2 && tank2[1] !== "0")) && (space_gear["mask"] && space_gear["gear"])){
                system.clearRun(cycle)
                player.removeTag("oxygen_hunger")
            }
        }, 20);
    }, 100);
}
export function update_tank(tank, o2) {
	tank.setLore([`${o2}`])
    const durability = tank.getComponent('minecraft:durability');
    durability.damage = durability.maxDurability - o2
    return tank;
}
function oxygen_bar(player, o2){
    player.onScreenDisplay.setActionBar(`${o2[0]} ${o2[1]}`);
}