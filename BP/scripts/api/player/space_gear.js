import { world, system, EquipmentSlot, ItemStack } from '@minecraft/server';

// This code is better now, but it still normal
const slots = [ "head","body","legs","feet","tank1","tank2","frequency","mask","parachute","thermal","gear" ];
const prefix = "csm:"; //prefix for item tags

/* unused
const maskTag = "mask(-)cosmos:oxygen_mask";
const gearTag = "gear(-)cosmos:oxygen_gear";
*/

// SPAWNS, NAMES, AND GIVES ITEMS TO THE ENTITY
function spawn(player){
	const entity = player.dimension.spawnEntity("cosmos:inv_ent", player.location);
	entity.nameTag = "space_gear(-)"; // needed for condition in UI
	entity.setDynamicProperty('owner', player.nameTag)
	setItems(player, entity)
	return entity
}

// DESPAWN OR KILL THE ENTITY
function despawn(entity, kill=false) {
	if (entity) system.run(()=> {
		if (kill) entity.runCommand("kill")
		try {entity.triggerEvent("cosmos:despawn")} catch(error) {null}
	})
}

// GIVES ITEMS TO THE ENTITY
function setItems(player, entity) {
	const container = entity.getComponent("inventory").container
	const space_gear = JSON.parse(player.getDynamicProperty("space_gear") ?? '{}')
	for (let i=0; i<slots.length; i++) {
		const slot = slots[i]
		if (space_gear[slot]) {
			const [item_id, fill_level] = space_gear[slot].split(' ')
			const item = new ItemStack(item_id)
			const durability = item.getComponent('minecraft:durability')
			if (durability) durability.damage = + fill_level
			container.setItem(i, item)
		} else container.setItem(i)
	}
}

// UPDATE SPACE GEAR DYNAMIC PROPERTY
function update(player, container) {
	const space_gear = JSON.parse(player.getDynamicProperty("space_gear") ?? '{}')
	for (let i=0; i<slots.length; i++) {
		const slot = slots[i];
		const item = container.getItem(i);
		if (item) {
			const durability = item.getComponent("minecraft:durability")
			space_gear[slot] = item.typeId + (durability ? ' ' + durability.damage : '')
		} else delete space_gear[slot]
	} player.setDynamicProperty("space_gear", JSON.stringify(space_gear))
}


// PREVENT OTHER PLAYERS FROM INTERACTING WITH THE ENTITY
world.beforeEvents.playerInteractWithEntity.subscribe((event)=> {
	const {player, target:entity} = event;
	if (entity.typeId != 'cosmos:inv_ent') return;
	
	const owner = entity.getDynamicProperty('owner')
	if (owner != player.nameTag ) {event.cancel = true; return}
	
	const holdingItem = player.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand)
	if (!player.isSneaking || holdingItem) {event.cancel = true; despawn(entity); return}
	
	let camera = player.getRotation(); camera = `${Math.round(camera.x)} ${Math.round(camera.y)}`
	system.run(()=> {entity.setDynamicProperty('view', camera)})
});

// DESPAWN ENTITY ON HIT
world.afterEvents.entityHitEntity.subscribe(({hitEntity:entity, damagingEntity:player})=> {
	if (entity.typeId == 'cosmos:inv_ent' && player.typeId == "minecraft:player") despawn(entity)
});

//DROP ITEMS AND DELETE ENTITY ON PLAYER DEATH
world.afterEvents.entityDie.subscribe(({deadEntity:player})=> {
	if (player.typeId != "minecraft:player") return
	const entities = player.dimension.getEntities({type: "cosmos:inv_ent"})//.filter(entity => entity.getDynamicProperty('owner') != player.nameTag)
	entities.length == 0 ? despawn(spawn(player), true) : entities.forEach(entity=> despawn(entity, true))
	player.setDynamicProperty("space_gear", undefined);
});

// DELETING ENTITY ON LEAVING -- This doesn't work for some reason
world.beforeEvents.playerLeave.subscribe(({player}) =>
	player.dimension.getEntities({type: "cosmos:inv_ent"}).forEach(entity => {
		if (entity.getDynamicProperty('owner') == player.nameTag) despawn(entity)
	})
)


// INVENTORY MANAGEMENT
system.runInterval(async()=> {
	world.getAllPlayers().forEach((player) => {
		// SNEAK DETECTION TO SPAWN THE ENTITY
		if (!player.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand) && player.isSneaking) {
			const entities = player.dimension.getEntities({type: "cosmos:inv_ent"}).map(entity => entity.getDynamicProperty('owner'))
			if (!entities.includes(player.nameTag)) spawn(player)
		}
		player.dimension.getEntities({type: "cosmos:inv_ent"}).forEach(entity => {
			const owner = entity.getDynamicProperty('owner')
			if (owner != player.nameTag) return
			
			// CAMERA MOVEMENT DETECTION TO DESPAWN THE ENTITY
			let camera = player.getRotation(); camera = `${Math.round(camera.x)} ${Math.round(camera.y)}`
			const view = entity.getDynamicProperty('view')
			if (view && (camera != view)) {
				despawn(entity)
			}
			
			// LET ENTITY FOLLOW THE PLAYER
			const location = player.location
			entity.teleport(location, {dimension: player.dimension});
			
			// REGECT ITEMS AND UPDATE THE INVENTORY
			const container = entity.getComponent("inventory").container;
			//let haveOxyFirst = false; let tank1; let tank2;
			for (let i=0; i<slots.length; i++) {
				let item = container.getItem(i);
				if (!item) continue;
				if (!(item.hasTag(prefix + slots[i]) || ([4,5].includes(i) && item.hasTag(prefix + "tank")))) { // drops disallowed items
					player.dimension.spawnItem(item, location);
					container.setItem(i)
				} else if (item.amount > 1) { //allows 1 accepted item to be equip
					item.amount -= 1;
					player.dimension.spawnItem(item, location);
					item.amount = 1;
					container.setItem(i, item)
				}/* unused
				if (checkOxygen(player) && system.currentTick%20 == 0 && ["tank1","tank2"].includes(slots[i])){
					if (slots[i]==="tank1") {
						tank1 = i;
					};
					if (slots[i]==="tank2") {
						tank2 = i;
					}
				};
				if (tank1 !== undefined && player.hasTag(maskTag) && player.hasTag(gearTag)){
					let ite = container.getItem(tank1);
					let dur = ite.getComponent("minecraft:durability");
					haveOxyFirst= dur.damage+1<dur.maxDurability;
					dur.damage = Math.min(dur.damage+1,dur.maxDurability);
					container.setItem(tank1,i)
				};
				if (tank2 !== undefined && !haveOxyFirst && player.hasTag(maskTag) && player.hasTag(gearTag)){
					let ite = container.getItem(tank2);
					let dur = ite.getComponent("minecraft:durability");
					dur.damage = Math.min(dur.damage+1,dur.maxDurability);
					container.setItem(tank2,i)
				};*/
			} update(player, container)
		})
	})
})

/* OXYGEN AND UNUSED FUNCTIONS - preserved for later use 
system.runInterval(async()=>{
	world.getAllPlayers().forEach((P) =>
	{
		let v1 = P.getDynamicProperty("oxygen_tank1")??0;
		let v2 = P.getDynamicProperty("oxygen_tank2")??0;
		if (v1 < 0) {
			v1=0;
			P.setDynamicProperty("oxygen_tank1",0);
		};
		if (v2 < 0) {
			v2=0;
			P.setDynamicProperty("oxygen_tank2",0);
		};
		if (!P.hasTag(maskTag) || !P.hasTag(gearTag) || !checkOxygen(P)) return P.removeTag("oxygen");
		if (v1+v2 > 0){
			P.addTag("oxygen")
		} else {
			P.removeTag("oxygen");
			return
		};
		if (v1>0) P.setDynamicProperty("oxygen_tank1",v1-1);
		if (!v1 && v2>0) P.setDynamicProperty("oxygen_tank1",v2-1);
		
	})
},20);

// returns true when player need oxygen from tanks
function checkOxygen(p){
	//there's no system for oxygen yet, so I left it empty 
	return p.hasTag("oxy_test") // it's only for testing 
}

//RESET DURABILTY SYSTEM
system.afterEvents.scriptEventReceive.subscribe((event)=> {
	if (event.id !== "delete:durability") return;
    let {sourceEntity:p} = event;
    let item = p.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand);
    let dur = item.getComponent("minecraft:durability");
    dur.damage = dur.maxDurability;
    p.getComponent("equippable").setEquipment(EquipmentSlot.Mainhand,item)
})

world.afterEvents.itemUse.subscribe((e)=>{
	all: for (let place of slots){
	local: if (e.itemStack.hasTag("g:"+place)){
		for (let tg of e.source.getTags()){
			if (tg.split("(-)")[0] == place){
				break local;
			};
		};
		e.source.addTag(place+"(-)"+e.itemStack.typeId);
		e.source.getComponent("equippable").setEquipment(EquipmentSlot.Mainhand);
		break all;
	}}
});
*/

