import { Plugin } from "obsidian";
import {
	AutoJournalSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import Core from "./core";
import { getJournalLink, navigateToJournalLink } from "./note-links";

export default class AutoJournal extends Plugin {
	settings: AutoJournalSettings;
	dailyFileFormat: string;
	monthlyFileFormat: string;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.addCommand({
			id: "manually-trigger",
			name: "Manually trigger",
			callback: () => {
				this.run();
			},
		});

		this.addCommand({
			id: "todays-daily-note",
			name: "Open todays daily note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"daily",
					"today"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		this.addCommand({
			id: "next-daily-note",
			name: "Open next daily note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"daily",
					"next"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		this.addCommand({
			id: "previous-daily-note",
			name: "Open previous daily note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"daily",
					"previous"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		this.addCommand({
			id: "todays-monthly-note",
			name: "Open todays monthly note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"monthly",
					"today"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		this.addCommand({
			id: "next-monthly-note",
			name: "Open next monthly note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"monthly",
					"next"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		this.addCommand({
			id: "previous-monthly-note",
			name: "Open previous monthly note",
			callback: () => {
				const link = getJournalLink(
					this.app,
					this.settings,
					"monthly",
					"previous"
				);
				navigateToJournalLink(this.app, this.settings, link);
			},
		});

		if (this.settings.automaticallyRun) {
			this.app.workspace.onLayoutReady(() => {
				this.run();
			});
		}
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
