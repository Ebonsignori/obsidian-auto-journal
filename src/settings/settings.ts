import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import moment from "moment-timezone";
import AtSymbolLinking from "src/main";
import { FileSuggest } from "./file-suggest";
import { FolderSuggest } from "./folder-suggest";

export enum BackFillOptions {
	NONE = "None",
	MONTH = "For month",
	YEAR = "For year",
}

export interface AutoJournalSettings {
	automaticallyRun: boolean;

	openNoteCommandInNewTab: boolean;

	rootFolder: string;
	timezone: string;
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

	shouldTemplateDate: boolean;
	templateDateToken: string;
	templateDateFormat: string;
	useTodayForLatestNote: boolean;
}

export const DEFAULT_SETTINGS: AutoJournalSettings = {
	automaticallyRun: true,

	openNoteCommandInNewTab: false,

	rootFolder: "Journal",
	timezone: "",
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

	shouldTemplateDate: true,
	templateDateToken: "{{auto-journal-date}}",
	templateDateFormat: "YYYY-MM-DD",
	useTodayForLatestNote: true,
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
			if (settings.dailyNotesTemplateFile) {
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
		}

		if (settings.monthlyNotesEnabled) {
			if (settings.monthlyNotesTemplateFile) {
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

		if (settings.shouldTemplateDate) {
			if (!settings.templateDateToken) {
				return updateSetting(
					"templateDateToken",
					DEFAULT_SETTINGS.templateDateToken
				);
			}
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.containerEl.appendChild(
			createHeading(containerEl, "Auto Journal settings", 2, false)
		);

		// - - - Begin Option: automaticallyRun
		const automaticallyRunDesc = document.createDocumentFragment();
		automaticallyRunDesc.append(
			`Run when Obsidian starts, otherwise you can run via the "Manually Trigger" command.`
		);
		new Setting(this.containerEl)
			.setName(`Automatically run?`)
			.setDesc(automaticallyRunDesc)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings["automaticallyRun"])
					.onChange(async (value: boolean) => {
						this.plugin.settings["automaticallyRun"] = value;
						await this.plugin.saveSettings();
					});
			});
		// - - - End Option: automaticallyRun

		// - - - Begin Option: rootFolder
		const rootFolderDesc = document.createDocumentFragment();
		rootFolderDesc.append(
			`Root path to create journal in. This should not be changed once set.`,
			rootFolderDesc.createEl("br"),
			rootFolderDesc.createEl("em", {
				text: `Leave empty to create journal entries in the root of the vault.`,
			})
		);
		new Setting(this.containerEl)
			.setName(`Root folder`)
			.setDesc(rootFolderDesc)
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("No root")
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

		this.createSharedSettings("Daily");
		this.createSharedSettings("Monthly");

		if (this.plugin.settings.monthlyNotesEnabled) {
			// - - - Begin Option: monthlyNotesFolderName
			const monthlyNotesFolderNameDesc =
				document.createDocumentFragment();
			monthlyNotesFolderNameDesc.append(
				`Name of the folder to create monthly notes in.`
			);
			new Setting(this.containerEl)
				.setName(`Monthly notes folder`)
				.setDesc(monthlyNotesFolderNameDesc)
				.addText((text) => {
					text.setPlaceholder("Check-Ins")
						.setValue(
							this.plugin.settings["monthlyNotesFolderName"]
						)
						.onChange(async (value: string) => {
							this.plugin.settings["monthlyNotesFolderName"] =
								value;
							await this.plugin.saveSettings();
						});
					text.inputEl.onblur = () => {
						this.display();
					};
				});
			// - - - End Option: monthlyNotesFolderName

			// - - - Begin Option: monthlyNotesDayOfMonth
			const monthlyNotesDayOfMonthDesc =
				document.createDocumentFragment();
			monthlyNotesDayOfMonthDesc.append(
				`Day of the month to create monthly notes on.`
			);
			new Setting(this.containerEl)
				.setName(`Monthly notes day of month`)
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

			// - - - Begin Option: useTodayForLatestNote
			const useTodayForLatestNoteDesc = document.createDocumentFragment();
			useTodayForLatestNoteDesc.append(
				`For the monthly notes, use today's date for this month's note instead of the monthly note's day of month setting.`
			);
			new Setting(this.containerEl)
				.setName(`Use today for latest note?`)
				.setDesc(useTodayForLatestNoteDesc)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings["useTodayForLatestNote"])
						.onChange(async (value: boolean) => {
							this.plugin.settings["useTodayForLatestNote"] =
								value;
							await this.plugin.saveSettings();
						});
				});
			// - - - End Option: useTodayForLatestNote
		}

		new Setting(this.containerEl).setName("Template date").setHeading();

		// - - - Begin Option: shouldTemplateDate
		const shouldTemplateDateDesc = document.createDocumentFragment();
		shouldTemplateDateDesc.append(
			`Toggle on to replace a token from template file in new note with date the file was supposed to be created on.`,
			shouldTemplateDateDesc.createEl("br"),
			"Template tags: {{title}}, {{date}}, and {{time}} from the core plugin will use the date that the file was created on.",
			shouldTemplateDateDesc.createEl("br"),
			`${this.plugin.settings["templateDateToken"]} will be replaced with the date the file represents.`
		);
		new Setting(this.containerEl)
			.setName(`Should replace token?`)
			.setDesc(shouldTemplateDateDesc)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings["shouldTemplateDate"])
					.onChange(async (value: boolean) => {
						this.plugin.settings["shouldTemplateDate"] = value;
						this.display();
						await this.plugin.saveSettings();
					});
			});
		// - - - End Option: shouldTemplateDate

		if (this.plugin.settings.shouldTemplateDate) {
			// - - - Begin Option: templateDateToken
			const templateDateTokenDesc = document.createDocumentFragment();
			templateDateTokenDesc.append(
				`Value of token to replace with date in template file.`
			);
			new Setting(this.containerEl)
				.setName(`Template date token`)
				.setDesc(templateDateTokenDesc)
				.addText((text) => {
					text.setPlaceholder(DEFAULT_SETTINGS.templateDateToken)
						.setValue(this.plugin.settings["templateDateToken"])
						.onChange(async (value: string) => {
							this.plugin.settings["templateDateToken"] = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.onblur = () => {
						this.validate();
						this.display();
					};
				});
			// - - - End Option: templateDateToken

			// - - - Begin Option: templateDateFormat
			const templateDateFormatDesc = document.createDocumentFragment();
			templateDateFormatDesc.append(
				`Format for the date that will replace the token. In `,
				createLink(
					templateDateFormatDesc,
					"moment.js date format",
					"https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/"
				),
				"."
			);
			new Setting(this.containerEl)
				.setName(`Template date format`)
				.setDesc(templateDateFormatDesc)
				.addMomentFormat((text) => {
					text.setPlaceholder("YYYY-MM-DD")
						.setValue(this.plugin.settings["templateDateFormat"])
						.onChange(async (value: string) => {
							this.plugin.settings["templateDateFormat"] = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.onblur = () => {
						this.display();
					};
				});
			// - - - End Option: templateDateFormat
		}

		new Setting(this.containerEl).setName("Advanced config").setHeading();

		// Begin Option: Open note command in new tab
		const openNoteCommandInNewTabDesc = document.createDocumentFragment();
		openNoteCommandInNewTabDesc.append(
			`Enable for shortcuts to open notes in new a new tab.`
		);
		new Setting(this.containerEl)
			.setName(`Open note command opens note in new tab?`)
			.setDesc(openNoteCommandInNewTabDesc)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings["openNoteCommandInNewTab"])
					.onChange(async (value: boolean) => {
						this.plugin.settings["openNoteCommandInNewTab"] = value;
						await this.plugin.saveSettings();
					});
			});

		// - - - Begin Option: timezone
		const timezoneDesc = document.createDocumentFragment();
		timezoneDesc.append(
			`Leave empty to attempt to use the timezone of the device (may not work on mobile).`,
			timezoneDesc.createEl("br")
		);
		new Setting(this.containerEl)
			.setName(`Timezone`)
			.setDesc(timezoneDesc)
			.addText((text) => {
				text.setPlaceholder(moment.tz.guess(true))
					.setValue(this.plugin.settings["timezone"])
					.onChange(async (value: string) => {
						this.plugin.settings["timezone"] = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.validate();
				};
			});
		// - - - End Option: timezone

		this.createDateFormatSetting("Year");
		this.createDateFormatSetting("Month");
		this.createDateFormatSetting("Day");
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
		const momentLink = createLink(
			yearFormatDesc,
			"moment.js date format",
			"https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/"
		);
		yearFormatDesc.append(
			`Format for the ${lowerType} that the file path uses. In `,
			momentLink,
			"."
		);
		new Setting(this.containerEl)
			.setName(`${type} format`)
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

		new Setting(this.containerEl).setName(`${type} notes`).setHeading();

		// - - - Begin Option: notesEnabled
		let pathString = "Notes will be saved to: ";
		if (type === "Daily") {
			pathString =
				pathString +
				`${this.plugin.settings.rootFolder}/${this.plugin.settings.yearFormat}/${this.plugin.settings.monthFormat}/${this.plugin.settings.dayFormat} -`;
		} else if (type === "Monthly") {
			pathString =
				pathString +
				`${this.plugin.settings.rootFolder}/${this.plugin.settings.yearFormat}/[${this.plugin.settings.monthlyNotesFolderName}]/${this.plugin.settings.monthFormat} -`;
		}
		const derivedFilePath = document.createDocumentFragment();
		derivedFilePath.append(pathString);
		const createNotesDesc = document.createDocumentFragment();
		createNotesDesc.append(
			`Toggle on/off to trigger ${lowerType} note functionality.`
		);
		if (this.plugin.settings[`${lowerType}NotesEnabled`]) {
			createNotesDesc.append(
				createNotesDesc.createEl("br"),
				derivedFilePath
			);
		}
		new Setting(this.containerEl)
			.setName(`Create ${lowerType} notes?`)
			.setDesc(createNotesDesc)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings[`${lowerType}NotesEnabled`])
					.onChange(async (value: boolean) => {
						this.plugin.settings[`${lowerType}NotesEnabled`] =
							value;
						await this.plugin.saveSettings();
						this.display();
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

		// Only show the following options if the notes are enabled
		if (this.plugin.settings[`${lowerType}NotesEnabled`]) {
			// - - - Begin Option: notesTemplateFile
			const notesTemplateFileDesc = document.createDocumentFragment();
			notesTemplateFileDesc.append(
				`Path to the template file used to create ${lowerType} notes. `,
				notesTemplateFileDesc.createEl("br"),
				notesTemplateFileDesc.createEl("em", {
					text: `Leave empty to create blank notes.`,
				})
			);
			new Setting(this.containerEl)
				.setName(`${type} notes template`)
				.setDesc(notesTemplateFileDesc)
				.addSearch((cb) => {
					new FileSuggest(this.app, cb.inputEl);
					cb.setPlaceholder("No template")
						.setValue(
							this.plugin.settings[
								`${lowerType}NotesTemplateFile`
							]
						)
						.onChange(async (newFile) => {
							this.plugin.settings[
								`${lowerType}NotesTemplateFile`
							] = newFile.trim();
							await this.plugin.saveSettings();
						});
					cb.inputEl.onblur = () => {
						this.validate();
					};
				});
			// - - - End Option: notesTemplateFile

			// - - - Begin Option: backfillNotes
			const backfillNotesDesc = document.createDocumentFragment();
			let timeSpanText = [] as Array<HTMLElement | string>;
			if (type === "Daily") {
				timeSpanText = [
					backfillNotesDesc.createEl("strong", { text: "For month" }),
					": backfill notes for each previous day in the current month.",
					backfillNotesDesc.createEl("br"),
					backfillNotesDesc.createEl("strong", { text: "For year" }),
					": backfill notes for each day in each previous month in the current year.",
				];
			} else if (type === "Monthly") {
				timeSpanText = [
					backfillNotesDesc.createEl("strong", { text: "For year" }),
					": backfill notes for each previous month in the current year.",
				];
			}

			backfillNotesDesc.append(
				`Enable to create missing ${lowerType} notes for previous ${
					type === "Daily" ? "days" : "months"
				} upon opening Obsidian.`,
				backfillNotesDesc.createEl("br"),
				...timeSpanText
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
				.setName(`Backfill ${lowerType} notes?`)
				.setDesc(backfillNotesDesc)
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(options)
						.setValue(
							this.plugin.settings[`${lowerType}NotesBackfill`]
						)
						.onChange(async (value: BackFillOptions) => {
							this.plugin.settings[`${lowerType}NotesBackfill`] =
								value;
							await this.plugin.saveSettings();
						})
				);
		}
	}
}

function createHeading(
	el: HTMLElement | DocumentFragment,
	text: string,
	level = 2,
	includeClass = true
) {
	const heading = el.createEl(`h${level}` as keyof HTMLElementTagNameMap, {
		text,
	});
	if (includeClass) {
		heading.addClass("auto-journal-heading");
	}
	return heading;
}

function createLink(
	el: HTMLElement | DocumentFragment,
	text: string,
	href: string
) {
	const link = el.createEl("a", { text, href });
	link.addClass("auto-journal-link");
	return link;
}
