 import { EquipmentSlot, ItemStack,ItemComponentTypes,system, world } from '@minecraft/server';
 // This code is not well-done, but it is normal
const slots = [ "head","body","legs","feet","tank1","tank2","frequency","mask","parachute","thermal","gear" ];
const prefix = "csm:"; //prefix for item tags
const maskTag = "mask(-)cosmos:oxygen_mask";
const gearTag = "gear(-)cosmos:oxygen_gear";



function checkOxygen(p){
	// should return true when player need oxygen from tanks
	// but there's no system for oxygen yet, so I left it empty 
	return p.hasTag("oxy_test") // it's only for testing 
}


// When player dies
function onDeath(P){
	let bc = world.getEntity(P.getDynamicProperty("eid"));
	P.setDynamicProperty("start",false);
	if(bc) bc.triggerEvent("minecraft:despawn");
	

	for (let tag of P.getTags()){
		if (tag.indexOf("(-)") == -1) continue;
		let [type,itemId] = tag.split("(-)");
		if (!slots.includes(type)) continue;
		const rand = Math.random()-0.5;
		let item = new ItemStack(itemId);
		if (["tank2","tank1"].includes(type)){
			let dur = item.getComponent(ItemComponentTypes.Durability);
			dur.damage = dur.maxDurability - P.getDynamicProperty("oxygen_"+type);
			
		};
		P.dimension.spawnItem(item,P.location).applyImpulse({x:rand/2,y:0.3,z:rand/2});
		P.removeTag(tag);
	};
	P.setDynamicProperty("oxygen_tank1",0);
	P.setDynamicProperty("max_oxygen_tank1",0);
	P.setDynamicProperty("oxygen_tank2",0);
	P.setDynamicProperty("max_oxygen_tank2",0);
	
}
// first action after player sneaks
function start(P){
	var bEntity = P.dimension.spawnEntity("cosmos:inv_ent",P.location);
	bEntity.nameTag="extra_slots_2024(-)"; // needed for condition in UI
	tagItemAdd(P,bEntity.getComponent("inventory").container,bEntity);
	P.setDynamicProperty("eid",bEntity.id);
	return bEntity.id
}
// deletes unknown tag for needed slot (when player takes equipment out of the slots)
function deleteFrom(P,slot){
	for (let tag of P.getTags()){
		if (tag.startsWith(slot)) P.removeTag(tag)
	}
}
function tagItemAdd(P,cont,e){
	let types = [];
	let items = [];
	P.getTags().forEach((tag)=>{
		if (tag.indexOf("(-)")==-1) return;
		let nn = tag.split("(-)");
		let type = nn[0];
		let i = nn[1];
		types.push(type);
		items.push(i)
	});
	
	setInSlots(P,types,items,cont,e);
}
// Sets the items from tags to entity's inventory
function setInSlots(P,types,items,cont,e){
	let inv = cont;
	if (!inv) return;
	for (let x in types){
		const index = slots.indexOf(types[x]);
		if (index == -1) continue;
		let item = new ItemStack(items[x]);
		if (types[x]=== "tank1" || types[x]=== "tank2"){
			let dur = item.getComponent(ItemComponentTypes.Durability);
			dur.damage =Math.max(dur.maxDurability-P.getDynamicProperty("oxygen_"+types[x])??0,0);
		};
		inv.setItem(index,item)
	}
}
function updateTags(P,e){
	const eInv = e.getComponent("inventory")?.container;
	for (let x=0;x<slots.length;x++){
		let item = eInv.getItem(x);
		if (!item) {
			deleteFrom(P,slots[x]);
			if (!slots[x].startsWith("tank"))continue;
			P.setDynamicProperty("oxygen_"+String(slots[x]), 0);
			P.setDynamicProperty("max_oxygen_"+String(slots[x]), 0);
			continue
		};
		
		
		deleteFrom(P,slots[x]);
		P.addTag(slots[x]+"(-)"+item.typeId);
		if (!slots[x].startsWith("tank"))continue;
		let dur = item.getComponent(ItemComponentTypes.Durability);
		P.setDynamicProperty("oxygen_"+String(slots[x]),dur.maxDurability-dur.damage);
		P.setDynamicProperty("max_oxygen_"+String(slots[x]),dur.maxDurability);
		
	}
}

/*world.afterEvents.itemUse.subscribe((e)=>{
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
});*/

//DEATH (dropping items)
world.afterEvents.entityDie.subscribe((e)=>{
	let p = e.deadEntity;
	if (p.typeId !== "minecraft:player") return;
	onDeath(p)
});


// OXYGEN
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

// Interacting with inventory
world.beforeEvents.playerInteractWithEntity.subscribe((ev)=>{
	let {player:p,target:e} = ev;
	if (e.typeId !== 'cosmos:inv_ent') return;
	if (world.getEntity(p.getDynamicProperty('eid')).id !== e.id) ev.cancel = true;
	if (p.hasTag("mobile_device")) return;
	if (p.isSneaking  && !p.hasTag('sneaked')) system.run(()=>{
		p.addTag('sneaked');
	});
	if (p.hasTag('sneaked')){
		system.run(()=>{
			p.removeTag('sneaked');
		});
		ev.cancel = true
	}
});

world.afterEvents.entityHitEntity.subscribe(({hitEntity:e,damagingEntity:p})=>{
	if (e.typeId ==='cosmos:inv_ent' && p.typeId === "minecraft:player"){
		if (p.hasTag('sneaked')){
			p.removeTag('sneaked');
		}
	}
});


// DELETING ENTITY ON LEAVING
world.beforeEvents.playerLeave.subscribe(({player})=>{
	let e = world.getEntity(player.getDynamicProperty("eid"));
	if (e) system.run(()=>e.triggerEvent("minecraft:despawn"))
});


// INVENTORY + Oxygen in tanks
system.runInterval(async()=>
 {
	try{world.getAllPlayers().forEach((P) =>
{

	if (true) {
	if (!P.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand) && P.isSneaking || (P.hasTag("sneaked") && !P.hasTag("mobile_device"))) 

{
	
	if (!P.getDynamicProperty("start")){
		//initializing entity + "linking" it to the player
		P,start(P);
		P.setDynamicProperty("start",true);
	} else {
		// updating tags and throwing out non-fitting items
		let bEntity = world.getEntity(P.getDynamicProperty("eid"));
		if (!bEntity) bEntity = start(P);
		bEntity.teleport(P.location,{dimension:P.dimension});
		let bc=bEntity.getComponent("inventory").container;
		let haveOxyFirst = false;
		let tank1;
		let tank2;
		for (let x=0;x<slots.length;x++){
  	 	 let item=bc.getItem(x);
			if (!item) continue;
 		   if (!item.hasTag(prefix+slots[x]) && !(["tank1","tank2"].includes(slots[x]) && item.hasTag(prefix+"tank"))){
				P.dimension.spawnItem(item, P.location);
				bc.setItem(x)
			}else if (item.amount > 1){
				item.amount -= 1;
				P.dimension.spawnItem(item, P.location);
				item.amount = 1;
				bc.setItem(x,item)
			};
			if (checkOxygen(P)&&system.currentTick%20 == 0 && ["tank1","tank2"].includes(slots[x])){
				
				if (slots[x]==="tank1") {
					
					tank1 = x;
				};
				if (slots[x]==="tank2"){
					
					tank2 = x;
				}
			};
		};
		if (tank1 !== undefined && P.hasTag(maskTag) && P.hasTag(gearTag)){
			let i = bc.getItem(tank1);
			let dur = i.getComponent(ItemComponentTypes.Durability);
			haveOxyFirst= dur.damage+1<dur.maxDurability;
			dur.damage = Math.min(dur.damage+1,dur.maxDurability);
			bc.setItem(tank1,i)
		};
		if (tank2 !== undefined && !haveOxyFirst && P.hasTag(maskTag) && P.hasTag(gearTag)){
			let i = bc.getItem(tank2);
			let dur = i.getComponent(ItemComponentTypes.Durability);
			dur.damage = Math.min(dur.damage+1,dur.maxDurability);
			bc.setItem(tank2,i)
		};
		updateTags(P,bEntity)
	};
}else if (P.getDynamicProperty("start")&& P.getDynamicProperty("eid")){
	//despawning the entity
	let bc = world.getEntity(P.getDynamicProperty("eid"));
	P.setDynamicProperty("start",false);
	if (!bc) return;
	updateTags(P,bc);
	bc.triggerEvent("minecraft:despawn");
};};
	});
}catch(e){console.error(e)};
});

 
system.afterEvents.scriptEventReceive.subscribe((event)=>{
	if (event.id !== "delete:durability") return;
    let {sourceEntity:p} = event;
    let item = p.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand);
    let dur = item.getComponent(ItemComponentTypes.Durability);
    dur.damage = dur.maxDurability;
    p.getComponent("equippable").setEquipment(EquipmentSlot.Mainhand,item)
    
})
