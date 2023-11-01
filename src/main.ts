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

		// Automatically run on startup if enabled
		if (this.settings.automaticallyRun) {
			this.app.workspace.onLayoutReady(() => {
				this.run();
			});
		}

		this.addCommand({
			id: "manually-trigger",
			name: "Manually trigger",
			callback: () => {
				this.run();
			},
		});

		const goToNote = (
			type: "daily" | "monthly",
			navigateTo: "previous" | "next" | "today"
		) => {
			const link = getJournalLink(
				this.app,
				this.settings,
				type,
				navigateTo
			);
			navigateToJournalLink(this.app, this.settings, link);
		};

		this.addCommand({
			id: "todays-daily-note",
			name: "Open today's daily note",
			callback: () => {
				goToNote("daily", "today");
			},
		});

		this.addCommand({
			id: "next-daily-note",
			name: "Open next daily note",
			callback: () => {
				goToNote("daily", "next");
			},
		});

		this.addCommand({
			id: "previous-daily-note",
			name: "Open previous daily note",
			callback: () => {
				goToNote("daily", "previous");
			},
		});

		this.addCommand({
			id: "todays-monthly-note",
			name: "Open todays monthly note",
			callback: () => {
				goToNote("monthly", "today");
			},
		});

		this.addCommand({
			id: "next-monthly-note",
			name: "Open next monthly note",
			callback: () => {
				goToNote("monthly", "next");
			},
		});

		this.addCommand({
			id: "previous-monthly-note",
			name: "Open previous monthly note",
			callback: () => {
				goToNote("monthly", "previous");
			},
		});

		const createNavigationButton = (
			container: HTMLElement,
			buttonType: string,
			buttonText: string,
			type: "daily" | "monthly",
			navigateTo: "previous" | "next" | "today"
		) => {
			const button = container.createEl("button", {
				text: buttonText,
				cls: `auto-journal-navigation-button auto-journal-${type} auto-journal-${navigateTo}`,
			});
			button.setAttribute("id", buttonType);
			button.onclick = () => {
				goToNote(type, navigateTo);
			};
			container.appendChild(button);
		};

		this.registerMarkdownCodeBlockProcessor(
			"auto-journal-navigation",
			(source, el) => {
				el.parentElement?.addClass("auto-journal-code-block-hidden");
				const container = el.createEl("div", {
					cls: "auto-journal-navigation-container",
				});

				const lines = source.split("\n");
				for (const line of lines) {
					const keyValues = line.split(":");
					if (keyValues.length !== 2) {
						continue;
					}
					const buttonType = keyValues[0].trim();
					const buttonText = keyValues[1].trim();
					if (buttonType === "today-daily") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"daily",
							"today"
						);
					}
					if (buttonType === "next-daily") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"daily",
							"next"
						);
					}
					if (buttonType === "previous-daily") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"daily",
							"previous"
						);
					}
					if (buttonType === "today-monthly") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"monthly",
							"today"
						);
					}
					if (buttonType === "next-monthly") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"monthly",
							"next"
						);
					}
					if (buttonType === "previous-monthly") {
						createNavigationButton(
							container,
							buttonType,
							buttonText,
							"monthly",
							"previous"
						);
					}
				}
			}
		);
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
