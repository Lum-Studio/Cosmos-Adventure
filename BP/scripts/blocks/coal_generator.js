import {world, system, ItemStack} from "@minecraft/server";

function generateHeat(block) {
	
	const fuel = block.getComponent('minecraft:inventory').container;
	let fuelItem = fuel.getItem(0);
	
	const burnTime = block.getDynamicProperty("burnTime") ?? 0
	const heat = block.getDynamicProperty("heat") ?? 0
	const energy = block.getDynamicProperty("energy") ?? 0
	
	if ( ["minecraft:coal", "minecraft:charcoal"].includes(fuelItem?.typeId)  && burnTime == 0) {
		fuelItem.amount > 1 ? fuelItem.amount-- : fuelItem = undefined
		fuel.setItem(0, fuelItem)
		block.setDynamicProperty("burnTime", 32)	
	} else if ( ["minecraft:coal_block"].includes(fuelItem?.typeId)  && burnTime == 0) {
		fuelItem.amount > 1 ? fuelItem.amount-- : fuelItem = undefined
		fuel.setItem(0, fuelItem)
		block.setDynamicProperty("burnTime", 320)	
	} else if (burnTime > 0) {
		block.setDynamicProperty("burnTime", burnTime > 1 ? burnTime - 1 : 0)
		block.setDynamicProperty("heat", heat < 90 ? heat + 10 : 100)
	}
	if (burnTime == 0 && energy == 0) {
		block.setDynamicProperty("heat", heat > 10 ? heat - 10 : 0)
	}
	if (heat == 100) {
		block.setDynamicProperty("energy", energy < 115 ? energy + 5 : 120)
	}
	if (burnTime == 0) {
		block.setDynamicProperty("energy", energy > 5 ? energy - 5 : 0)
	}
	block.nameTag = `bt ${Math.floor(burnTime /2)}s, heat ${heat}%, en ${energy}gJ/s`
	
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if( event.id == "cosmos:tick" && event.message == "coal_generator") {
		generateHeat(event.sourceEntity)
	}
})