import machines from "../core/machines/AllMachineBlocks"

export function get_data(machine) {
	return machines[machine.typeId.replace('cosmos:machine:', '')]
}

export function str(object) { return JSON.stringify(object) }

export function compare_lists(list1, list2) {
	for (let i = 0; i < list1.length; i++) {
		if (list1[i] != list2[i]) return false
	} return true
}
export function get_vars(item, index, def = 0) {
    return item ? + item.getLore()[index] : def
}

export function get_lore(container, data, name, def=0) {
	const lore_item = container.getItem(data.lore.slot)
	return lore_item ? + lore_item?.getLore()?.[data.lore[name]] : def
}

export const pickaxes = new Set([
	"minecraft:wooden_pickaxe",
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:golden_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])

export function delay(ticks) {
    return new Promise(res => system.runTimeout(res, ticks * 20));
}
export function isUnderground(player) {
	let block = player.dimension.getTopmostBlock(player.location)
	if (player.location.y >= block.y) return false
	while (!block.isSolid && block.y > player.dimension.heightRange.min) {
	  if (player.location.y >= block.y) return false
	  block = block.below()
	}
	return true
  }

export function parseItem(json) {
	if (typeof(json) == "string") {
	  json = JSON.parse(json)
	}
	
	let item = new ItemStack(json.type, json.amount)
	item.lockMode = json.lockMode
	item.keepOnDeath = json.keepOnDeath
	item.nameTag = json.nameTag
	
	item.setCanDestroy(json.canDestroy)
	item.setCanPlaceOn(json.canPlaceOn)
	item.setLore(json.lore)
	
	json.properties.forEach(property => {
	  item.setDynamicProperty(property.id, property.value)
	})
	
	if (item.getComponent("minecraft:durability")) {
	  item.getComponent("minecraft:durability").damage = json.durability
	}
	
	if (item.getComponent("minecraft:enchantable")) {
	  item.getComponent("minecraft:enchantable").addEnchantments(json.enchantments.map(enc => {
		return {
		  level: enc.level,
		  type: new EnchantmentType(enc.type.id)
		}
	  }))
	}
	
	if (item.getComponent("minecraft:dyeable")) {
	  item.getComponent("minecraft:dyeable").color = json.dyeColor
	}
	
	return item
  }

export function getDevice(player) {
	const { platformType, memoryTier, maxRenderDistance } = player.clientSystemInfo;
  
	if (maxRenderDistance < 6 || maxRenderDistance > 96 || platformType === null) return "Bot";
  
	if (platformType === "Desktop") return "Windows";
  
	if (platformType === "Mobile") {
	  return maxRenderDistance > 16 ? "Android" : "iOS";
	}
  
	if (platformType === "Console") {
	  if (memoryTier === 3 && maxRenderDistance === 12) return "Nintendo Switch";
	  if (memoryTier === 4 && maxRenderDistance === 36) return "Xbox Series S";
	  if (memoryTier === 5 && maxRenderDistance === 36) return "Xbox Series X";
  
	  if (memoryTier === 4) {
		if (player.name.match(/[_-]/g) && maxRenderDistance === 16) return "PS4";
		if (maxRenderDistance === 16) return "Xbox One";
		if (maxRenderDistance === 18) return "PS4 Pro";
		if (maxRenderDistance === 28) return "PS5";
	  }
	}
  
	return "Unknown Device";
  }
  
export function stringifyItem(item) {
	let json = {
	  type: item.typeId,
	  amount: item.amount,
	  keepOnDeath: item.keepOnDeath,
	  lockMode: item.lockMode,
	  nameTag: item.nameTag,
	  canDestroy: item.getCanDestroy(),
	  canPlaceOn: item.getCanPlaceOn(),
	  lore: item.getLore(),
	  properties: item.getDynamicPropertyIds().map(id => {
		return {
		  id: id,
		  value: item.getDynamicProperty(id)
		}
	  }),
	  durability: item.getComponent("minecraft:durability")?.damage,
	  dyeColor: item.getComponent("minecraft:dyeable")?.color,
	  enchantments: item.getComponent("minecraft:enchantable")?.getEnchantments() || []
	}
	return JSON.stringify(json)
  }




