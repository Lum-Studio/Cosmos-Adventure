import { world } from "@minecraft/server";

function assemble(block) {
	for (let x of [-1, 0, 1]) {
		for (let z of [-1, 0, 1]) {
			const target = block.offset({x:x, y:0, z:z})
			if (target.typeId != "cosmos:rocket_launch_pad") return
		}
	} block.setPermutation(block.permutation.withState( 'cosmos:center', true))
}
function destroy(block) {
	const dimension = block.dimension
	const {x, y, z} = block.center()
	dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run kill @e[c=1, r=1, type=cosmos:rocket_tire_1]`)
	for (let i of [-1, 0, 1]) {
		for (let j of [-1, 0, 1]) {
			const target = block.offset({x:i, y:0, z:j})
			if (target.typeId == "cosmos:rocket_launch_pad") {
				const {x, y, z} = target
				dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} air destroy`)
			}
		}
	}
}
world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:rocket_launch_pad', {
		onPlace({block}) {
			for (let x of [-1, 0, 1]) {
				for (let z of [-1, 0, 1]) {
					const target = block.offset({x:x, y:0, z:z})
					assemble(target)
				}
			}
		},
		onPlayerInteract({block, player, dimension}) {
			const pad = block.permutation
			const center = pad.getState("cosmos:center")
			const equipment = player.getComponent("minecraft:equippable")
			const item = equipment.getEquipment("Mainhand")

			if (item?.typeId != "cosmos:rocket_tier_1" || !center) return
			if (dimension.getEntities({ location: block.center(), maxDistance: 1 }).length) return

			const {x, y, z} = block.center()
			const rotation = Math.round(player.getRotation().y / 90) * 90 + 180
			dimension.runCommand(`summon cosmos:rocket_tire_1 ${x} ${y - 0.3} ${z} ${rotation}`)
			if (player.getGameMode() != "creative") equipment.setEquipment("Mainhand", item.decrementStack())
		},
		onPlayerDestroy({block, destroyedBlockPermutation: pad}) {
			if (pad.getState("cosmos:center")) {
				destroy(block); return
			}
			for (let x of [-1, 0, 1]) {
				for (let z of [-1, 0, 1]) {
					const target = block.offset({x: x, y: 0, z: z})
					if (target.typeId != "cosmos:rocket_launch_pad") continue
					if (target.permutation.getState("cosmos:center")) {
						destroy(target); return
					}
				}
			}
		}
	})
})
