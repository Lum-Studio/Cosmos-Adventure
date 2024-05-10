import {world, system} from "@minecraft/server";
import {charge} from "../machines/electricity"

system.afterEvents.scriptEventReceive.subscribe((event) => {
	const block = event.sourceEntity
    if( event.id == "cosmos:tick" && event.message == "energy_storage_module") {
		charge(block)
	}
})