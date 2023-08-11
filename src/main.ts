import { Plugin } from "obsidian";
import {
	AutoJournalSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import Core from "./core";

export default class AutoJournal extends Plugin {
	settings: AutoJournalSettings;
	dailyFileFormat: string;
	monthlyFileFormat: string;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.addCommand({
			id: "manually-trigger",
			name: "Manually Trigger",
			callback: () => {
				this.run();
			},
		});
	}

	async run() {
		new Core(this.settings, this.app).run();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
