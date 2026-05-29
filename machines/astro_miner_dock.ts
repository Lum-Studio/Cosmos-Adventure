import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("astro_miner_dock", "Astro Miner Dock", 221, 256));

	// Background texture - The Java mod used this texture.
	m.drawImage("textures/ui/cosmos/machines/gui_astro_miner_dock", 0, 0, 256, 221, { name: "bg" });

	m.drawTitle();

	// Energy Slot: index 0, x=230, y=108
	m.slot(230, 108, { name: "battery_slot", ghost: "power" });

	m.slotGrid(8, 18, 12, 6, { name: "dock_slots" });

	// Energy Bar: Base position x=234, y=29
	m.drawEnergyBar(234, 29);

	// Player inventory embedded in the 256x221 texture
	// Java: label at (7, 129), inv slots at (8, 139), hotbar at (8, 197)
	m.drawPlayerInventory(0, 129);
	m.drawHotbar(0, 197);

	// Recall Button: x=173, y=195, width=76, height=20
	m.addButton(173, 195, { name: "recall_button" });
}
