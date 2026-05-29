import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("astro_miner_dock", "Astro Miner Dock", 221, 256));

	// Background texture - The Java mod used this texture.
	m.drawImage("textures/ui/cosmos/machines/gui_astro_miner_dock", 0, 0, 256, 221, { name: "bg" });

	m.drawTitle();

	// All positions shifted by -1 to account for Java slot coordinate convention
	// (Java coords point to 16x16 item area; slot background draws at x-1, y-1)

	// Energy Slot: Java (230, 108) → (229, 107)
	m.slot(229, 107, { name: "battery_slot", ghost: "power" });

	// Dock grid: Java (8, 18) → (7, 17)
	m.slotGrid(7, 17, 12, 6, { name: "dock_slots" });

	// Energy Bar: Java (234, 29) → (233, 28), vertical 8x66
	m.drawVerticalEnergyBar(233, 28);

	// Player inventory: shift panel by -1
	m.drawPlayerInventory(-1, 128, { size: [176, 90] });
	m.drawHotbar(6, 196, { size: [162, 18] });

	// Recall Button: x=173, y=195, width=76, height=20
	m.addButton(173, 195, { name: "recall_button" });
}
