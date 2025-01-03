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
function isUndeground(player) {
	let block = player.dimension.getTopmostBlock(player.location)
	if (player.location.y >= block.y) return false
	while (!block.isSolid && block.y > player.dimension.heightRange.min) {
	  if (player.location.y >= block.y) return false
	  block = block.below()
	}
	return true
  }