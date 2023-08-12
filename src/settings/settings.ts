import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import AtSymbolLinking from "src/main";
import { FileSuggest } from "./file-suggest";
import { FolderSuggest } from "./folder-suggest";

export enum BackFillOptions {
	NONE = "None",
	MONTH = "For month",
	YEAR = "For year",
}

export interface AutoJournalSettings {
	rootFolder: string;
	yearFormat: string;
	monthFormat: string;
	dayFormat: string;

	dailyNotesEnabled: boolean;
	dailyNotesTemplateFile: string;
	dailyNotesShouldNotify: boolean;
	dailyNotesBackfill: BackFillOptions;

	monthlyNotesEnabled: boolean;
	monthlyNotesTemplateFile: string;
	monthlyNotesFolderName: string;
	monthlyNotesShouldNotify: boolean;
	monthlyNotesBackfill: BackFillOptions;
	monthlyNotesDayOfMonth: number;
}

export const DEFAULT_SETTINGS: AutoJournalSettings = {
	rootFolder: "Journal",
	yearFormat: "YYYY",
	monthFormat: "MMMM",
	dayFormat: "DD",

	dailyNotesEnabled: false,
	dailyNotesTemplateFile: "",
	dailyNotesShouldNotify: false,
	dailyNotesBackfill: BackFillOptions.NONE,

	monthlyNotesEnabled: false,
	monthlyNotesTemplateFile: "",
	monthlyNotesFolderName: "Check-Ins",
	monthlyNotesDayOfMonth: 1,
	monthlyNotesShouldNotify: true,
	monthlyNotesBackfill: BackFillOptions.NONE,
};

export class SettingsTab extends PluginSettingTab {
	plugin: AtSymbolLinking;

	constructor(app: App, plugin: AtSymbolLinking) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Run the plugin when the settings tab is closed
	hide() {
		this.plugin.run();
	}

	async validate() {
		const settings = this.plugin.settings;
		const updateSetting = async (
			setting: keyof AutoJournalSettings,
			value: any
		) => {
			// @ts-expect-error update setting with any
			this.plugin.settings[setting] = value;
			await this.plugin.saveSettings();
			return this.display();
		};

		if (!settings.yearFormat.match(/[Y]/g)) {
			new Notice(`Year format must contain at least one 'Y' character.`);
			return updateSetting("yearFormat", "YYYY");
		}

		if (!settings.monthFormat.match(/[M]/g)) {
			new Notice(`Month format must contain at least one 'M' character.`);
			return updateSetting("monthFormat", "MMMM");
		}

		if (!settings.dayFormat.match(/[D]/g)) {
			new Notice(`Day format must contain at least one 'D' character.`);
			return updateSetting("dayFormat", "DD");
		}

		if (settings.dailyNotesEnabled) {
			if (!settings.dailyNotesTemplateFile) {
				new Notice(
					`Must select a template file when daily notes are enabled.`
				);
				return updateSetting("dailyNotesEnabled", false);
			}
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.dailyNotesTemplateFile}.md`
			);
			if (!templateFile) {
				new Notice(
					`Daily notes template file not found in ${settings.dailyNotesTemplateFile}. Please update template file in the settings.`
				);
				return updateSetting("dailyNotesEnabled", false);
			}
		}

		if (settings.monthlyNotesEnabled) {
			if (!settings.monthlyNotesTemplateFile) {
				new Notice(
					`Must select a template file when monthly notes are enabled.`
				);
				return updateSetting("monthlyNotesEnabled", false);
			}
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.monthlyNotesTemplateFile}.md`
			);
			if (!templateFile) {
				new Notice(
					`Monthly notes template file not found in ${settings.monthlyNotesTemplateFile}. Please update template file in the settings.`
				);
				return updateSetting("monthlyNotesEnabled", false);
			}
		}
	}

	// TODO: Add validation at settings level to make sure dependent settings are set when
	// an option is enabled
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Add a description to the top of the settings tab
		const descEl = document.createDocumentFragment();
		descEl.append(
			descEl.createEl("strong", { text: "What is Auto Journal?" }),
			descEl.createEl("br"),
			"The core 'Daily notes' plugin doesn't backfill notes for the days you didn't open Obsidian. This plugin does.",
			descEl.createEl("br"),
			"This plugin creates daily and/or monthly notes based on a template.",
			descEl.createEl("br"),
			"It's opinionated in that it creates notes in the following folder structure: root/year/month/day -.md"
		);
		new Setting(this.containerEl).setDesc(descEl);

		// - - - Begin Option: rootFolder
		const rootFolderDesc = document.createDocumentFragment();
		rootFolderDesc.append(
			`Root path to create journal in. This should not be changed once set.`,
			rootFolderDesc.createEl("br"),
			`Leave empty to create journal entries in the root of the vault.`
		);
		new Setting(this.containerEl)
			.setName(`Root Folder`)
			.setDesc(rootFolderDesc)
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("Journal")
					.setValue(this.plugin.settings["rootFolder"])
					.onChange(async (newFolder) => {
						this.plugin.settings["rootFolder"] = newFolder.trim();
						await this.plugin.saveSettings();
					});
				cb.inputEl.onblur = () => {
					this.display();
				};
			});
		// - - - End Option: rootFolder

		this.createDateFormatSetting("Year");
		this.createDateFormatSetting("Month");
		this.createDateFormatSetting("Day");

		this.createSharedSettings("Daily");
		this.createSharedSettings("Monthly");

		// - - - Begin Option: monthlyNotesFolderName
		const monthlyNotesFolderNameDesc = document.createDocumentFragment();
		monthlyNotesFolderNameDesc.append(
			`Name of the folder to create monthly notes in.`
		);
		new Setting(this.containerEl)
			.setName(`Monthly Notes Folder Name`)
			.setDesc(monthlyNotesFolderNameDesc)
			.addText((text) => {
				text.setPlaceholder("check-ins")
					.setValue(this.plugin.settings["monthlyNotesFolderName"])
					.onChange(async (value: string) => {
						this.plugin.settings["monthlyNotesFolderName"] = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.display();
				};
			});
		// - - - End Option: monthlyNotesFolderName

		// - - - Begin Option: monthlyNotesDayOfMonth
		const monthlyNotesDayOfMonthDesc = document.createDocumentFragment();
		monthlyNotesDayOfMonthDesc.append(
			`Day of the month to create monthly notes on.`
		);
		new Setting(this.containerEl)
			.setName(`Monthly Notes Day of Month`)
			.setDesc(monthlyNotesDayOfMonthDesc)
			.addText((text) => {
				text.setPlaceholder("1")
					.setValue(
						this.plugin.settings[
							"monthlyNotesDayOfMonth"
						].toString()
					)
					.onChange(async (value: string) => {
						if (isNaN(parseInt(value))) {
							return this.display();
						}
						this.plugin.settings["monthlyNotesDayOfMonth"] =
							parseInt(value);
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = async () => {
					const value =
						this.plugin.settings["monthlyNotesDayOfMonth"];
					if (value < 1) {
						this.plugin.settings["monthlyNotesDayOfMonth"] = 1;
						await this.plugin.saveSettings();
						await this.display();
					} else if (value > 28) {
						this.plugin.settings["monthlyNotesDayOfMonth"] = 28;
						await this.plugin.saveSettings();
						await this.display();
					}
				};
			});
		// - - - End Option: monthlyNotesDayOfMonth
	}

	createDateFormatSetting(type: "Year" | "Month" | "Day"): void {
		const lowerType = type.toLowerCase() as "year" | "month" | "day";
		let placeHolder = "YYYY";
		if (type === "Month") {
			placeHolder = "MMMM";
		} else if (type === "Day") {
			placeHolder = "DD";
		}

		const yearFormatDesc = document.createDocumentFragment();
		yearFormatDesc.append(
			`Format for the ${lowerType} that the file path uses. In `,
			yearFormatDesc.createEl("a", {
				text: "moment.js date format",
				href: "https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/",
			})
		);
		new Setting(this.containerEl)
			.setName(`${type} Format`)
			.setDesc(yearFormatDesc)
			.addMomentFormat((text) => {
				text.setPlaceholder(placeHolder)
					.setValue(this.plugin.settings[`${lowerType}Format`])
					.onChange(async (value: string) => {
						this.plugin.settings[`${lowerType}Format`] = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.validate();
					this.display();
				};
			});
	}

	createSharedSettings(type: "Daily" | "Monthly"): void {
		const lowerType = type.toLowerCase() as "daily" | "monthly";
		// Notes type Heading
		const notesEl = document.createDocumentFragment();
		const notesHeading = notesEl.createEl("h2", {
			text: `${type} Notes`,
		});
		notesHeading.addClass("auto-journal-notes-heading");

		let rootFolder = `[${this.plugin.settings.rootFolder}]/`;
		if (this.plugin.settings.rootFolder === "") {
			rootFolder = "";
		}
		let derivedFilePath = `${rootFolder}${this.plugin.settings.yearFormat}/${this.plugin.settings.monthFormat}/${this.plugin.settings.dayFormat} -	`;
		if (type === "Monthly") {
			derivedFilePath = `${rootFolder}${this.plugin.settings.yearFormat}/[${this.plugin.settings.monthlyNotesFolderName}]/${this.plugin.settings.monthFormat} -`;
		}
		const notesBody = notesEl.createEl("p", {
			text: `Notes will be created using the following path: ${derivedFilePath}`,
		});
		notesBody.addClass("auto-journal-notes-body");
		notesEl.append(notesHeading);
		notesEl.append(notesBody);

		new Setting(this.containerEl).setDesc(notesEl);

		// - - - Begin Option: notesEnabled
		const createNotesDesc = document.createDocumentFragment();
		createNotesDesc.append(
			`Toggle off to disable ${lowerType} note functionality.`
		);
		new Setting(this.containerEl)
			.setName(`Create ${type} Notes?`)
			.setDesc(createNotesDesc)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings[`${lowerType}NotesEnabled`])
					.onChange(async (value: boolean) => {
						this.plugin.settings[`${lowerType}NotesEnabled`] =
							value;
						await this.plugin.saveSettings();
						return this.validate();
					});
			});
		// - - - End Option: notesEnabled

		// - - - Begin Option: notesFilePath
		// TODO: One day make this configurable - perhaps store day / month / year info in frontmatter instead of file/folder structure?
		// const notesFilePathDesc = document.createDocumentFragment();
		// notesFilePathDesc.append(
		// 	`Path to create ${lowerType} note. This cannot be changed.`
		// );
		// new Setting(this.containerEl)
		// 	.setName(`${type} Notes Path`)
		// 	.setDesc(notesFilePathDesc)
		// 	.addText((text) =>
		// 		text.setDisabled(true).setValue(derivedFilePath)
		// 	);
		// - - - End Option: notesFilePath

		// - - - Begin Option: notesTemplateFile
		const notesTemplateFileDesc = document.createDocumentFragment();
		notesTemplateFileDesc.append(
			`Path to the template file used to create ${lowerType} notes.`
		);
		new Setting(this.containerEl)
			.setName(`${type} Notes Template`)
			.setDesc(notesTemplateFileDesc)
			.addSearch((cb) => {
				new FileSuggest(this.app, cb.inputEl);
				cb.setPlaceholder(
					type === "Daily"
						? "Templates/journal"
						: "Templates/check-in"
				)
					.setValue(
						this.plugin.settings[`${lowerType}NotesTemplateFile`]
					)
					.onChange(async (newFile) => {
						this.plugin.settings[`${lowerType}NotesTemplateFile`] =
							newFile.trim();
						await this.plugin.saveSettings();
					});
				cb.inputEl.onblur = () => {
					this.validate();
				};
			});
		// - - - End Option: notesTemplateFile

		// - - - Begin Option: backfillNotes
		const backfillNotesDesc = document.createDocumentFragment();
		backfillNotesDesc.append(
			`Enable to create ${lowerType} notes for months/years that don't have them upon opening Obsidian.`
		);
		const options = {
			[BackFillOptions.NONE]: BackFillOptions.NONE,
			[BackFillOptions.YEAR]: BackFillOptions.YEAR,
		};
		if (type === "Daily") {
			// @ts-expect-error adding to options
			options[BackFillOptions.MONTH] = BackFillOptions.MONTH;
		}
		new Setting(this.containerEl)
			.setName(`Backfill ${type} Notes?`)
			.setDesc(backfillNotesDesc)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(options)
					.setValue(this.plugin.settings[`${lowerType}NotesBackfill`])
					.onChange(async (value: BackFillOptions) => {
						this.plugin.settings[`${lowerType}NotesBackfill`] =
							value;
						await this.plugin.saveSettings();
					})
			);
	}
}
