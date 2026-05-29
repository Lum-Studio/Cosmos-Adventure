import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("launch_controller", "Launch Controller", 209));
	m.drawTitle();

	// Real slot 0
	m.slot(152, 105, { name: "battery_slot", ghost: "power" });

	// UI slot 1
	m.drawEnergyBar(99, 114);

	// Buttons & Inputs (UI slots 2-6)
	m.addButton(122, 16, { name: "enable_button" });
	m.addButton(66, 16, { name: "frequency_button" });
	m.addButton(45, 38, { name: "dest_frequency_button" });
	m.addButton(95, 38, { name: "hide_dest_button" });
	m.addButton(48, 62, { name: "advanced_button" });

	// UI slot 7
	m.drawStatusText(0, 86, { name: "status_text", anchor: "top_middle" });

	// Static text
	m.drawString("Frequency:", 7, 22);
	m.drawString("Dest Frequency:", 7, 44);
}
