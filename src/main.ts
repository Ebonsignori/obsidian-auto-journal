import { Plugin } from "obsidian";
import {
	AutoJournalSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import Core from "./core";
import {
	getDateFromNotePath,
	getJournalLinkForDay,
	getNextDayJournalLink,
	getPreviousDayJournalLink,
} from "./note-links";
import moment from "moment-timezone";

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

		this.addCommand({
			id: "todays-daily-note",
			name: "Open todays daily note",
			callback: () => {
				const link = getJournalLinkForDay(this.app, this.settings);
				if (link) {
					this.app.workspace.openLinkText(link, "", this.settings.openNoteCommandInNewTab);
				}
			},
		});

		const getXDayJournalLink = (
			nextPrevFunction: typeof getNextDayJournalLink
		) => {
			const currentFile = this.app.workspace.getActiveFile();
			let startDate = moment();
			if (currentFile?.path) {
				startDate = getDateFromNotePath(
					this.settings,
					currentFile?.path
				);
			}

			const link = nextPrevFunction(startDate, this.app, this.settings);
			if (link) {
				this.app.workspace.openLinkText(link, "", this.settings.openNoteCommandInNewTab);
			}
		};

		this.addCommand({
			id: "previous-daily-note",
			name: "Open next daily note",
			callback: () => {
				getXDayJournalLink(getNextDayJournalLink);
			},
		});

		this.addCommand({
			id: "next-daily-note",
			name: "Open previous daily note",
			callback: () => {
				getXDayJournalLink(getPreviousDayJournalLink);
			},
		});

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.automaticallyRun) {
				this.run();
			}
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
