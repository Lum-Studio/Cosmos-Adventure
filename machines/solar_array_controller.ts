import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("solar_array_controller", "Solar Array Controller", 209));

	// Label "Solar Array Controller": x=88, y=7, centered
	m.drawTitle(0, 7, { anchor: "top_middle" });

	// Slot index 0: x=152, y=91
	m.slot(152, 91, { name: "battery_slot", ghost: "power" });

	// Label "Generating: ": x=88, y=46
	m.drawStatusText(88, 46, { name: "generating" });

	// Label "Status: ": x=88, y=57
	m.drawStatusText(88, 57, { name: "status" });

	// Label "Environment: ": x=88, y=68
	m.drawStatusText(88, 68, { name: "environment" });

	// Label "Connected Panels: ": x=88, y=79
	m.drawStatusText(88, 79, { name: "connected_panels" });

	// Label "Inventory": x=8, y=115
	m.drawString("Inventory", 8, 115);

	// Button id 0: x=52, y=93, w=72, h=20
	m.addButton(52, 93, { name: "enable_button" });
}
