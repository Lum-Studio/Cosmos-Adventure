import {system, world} from "@minecraft/server"

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
	if (event.target.typeId != 'cosmos:alien_villager') return;
	if(!event.player.getProperty("cosmos:frequency_module")){ 
	    event.cancel = true;
	    system.run(() => {
	        world.sendMessage({translate: "gui.village.warning.no_freq_mod"});
	    });
	}
});