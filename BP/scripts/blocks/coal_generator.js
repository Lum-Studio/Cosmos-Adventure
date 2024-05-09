import {world, system} from "@minecraft/server";
import {charge} from "../machines/electricity"

function generateHeat(block) {
	const fuel = block.getComponent('minecraft:inventory').container;
	let fuelItem = fuel.getItem(0);
	
	const burnTime = block.getDynamicProperty("burnTime") ?? 0
	const heat = block.getDynamicProperty("heat") ?? 0
	const power = block.getProperty("cosmos:power")
	
	//world.sendMessage(`bt ${Math.floor(burnTime /2)}s, heat ${heat}%, po ${power}gJ/t`)

	if ( ["minecraft:coal", "minecraft:charcoal"].includes(fuelItem?.typeId)  && burnTime == 0) {
		fuelItem.amount > 1 ? fuelItem.amount-- : fuelItem = undefined
		fuel.setItem(0, fuelItem)
		block.setDynamicProperty("burnTime", 320)	
	} else if ( ["minecraft:coal_block"].includes(fuelItem?.typeId)  && burnTime == 0) {
		fuelItem.amount > 1 ? fuelItem.amount-- : fuelItem = undefined
		fuel.setItem(0, fuelItem)
		block.setDynamicProperty("burnTime", 3200)	
	} else if (burnTime > 0) {
		block.setDynamicProperty("burnTime", burnTime > 1 ? burnTime - 1 : 0)
		block.setDynamicProperty("heat", heat < 99 ? heat + 1 : 100)
	}
	if (burnTime == 0 && power == 0) {
		block.setDynamicProperty("heat", heat > 1 ? heat - 1 : 0)
	}
	if (burnTime != 0 && heat == 100 && burnTime % 3 == 0) {
		block.setProperty("cosmos:power", power < 119 ? power + 1 : 120)
	}
	if (burnTime == 0 && system.currentTick % 3 == 0) {
		block.setProperty("cosmos:power", power > 1 ? power - 1 : 0)
	}
	const bt = block.getDynamicProperty("burnTime") ?? 0
	const he = block.getDynamicProperty("heat") ?? 0
	const po = block.getProperty("cosmos:power")
	block.nameTag = `bt ${Math.floor(bt /2)}t, heat ${he}%, po ${po}gJ/t`
	//world.sendMessage(`bt ${Math.floor(bt /2)}s, heat ${he}%, po ${po}gJ/t`)
	
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if( event.id == "cosmos:tick" && event.message == "coal_generator") {
		generateHeat(event.sourceEntity)
		charge(event.sourceEntity)
	}
})
