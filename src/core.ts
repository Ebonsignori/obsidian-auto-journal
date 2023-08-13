import { App, Notice, TFile, moment } from "obsidian";
import { AutoJournalSettings, BackFillOptions } from "./settings/settings";
import path from "path-browserify";
import { APP_NAME, errorNotice } from "./utils";
import { Moment } from "moment";

export default class Core {
	app: App;
	settings: AutoJournalSettings;
	dailyFileFormat: string;
	monthlyFileFormat: string;

	constructor(settings: AutoJournalSettings, app: App) {
		this.settings = settings;
		this.app = app;
	}

	async run() {
		this.dailyFileFormat = `${this.settings.yearFormat}/${this.settings.monthFormat}/${this.settings.dayFormat} -`;
		this.monthlyFileFormat = `${this.settings.yearFormat}/[${this.settings.monthlyNotesFolderName}]/${this.settings.monthFormat} -`;

		if (this.settings.dailyNotesEnabled) {
			await this.createDailyNote().catch((error) => {
				errorNotice(error.message);
			});
		}

		if (this.settings.monthlyNotesEnabled) {
			await this.createMonthlyNote().catch((error) => {
				errorNotice(error.message);
			});
		}
	}

	async createDailyNote() {
		let templateContents = "";
		if (this.settings.dailyNotesTemplateFile) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${this.settings.dailyNotesTemplateFile}.md`
			);
			if (!templateFile) {
				return new Notice(
					`Daily notes template file not found in ${this.settings.dailyNotesTemplateFile} ${APP_NAME}. Please update template file in the settings.`
				);
			}
			templateContents = await this.app.vault.read(templateFile as TFile);
		}

		const year = moment().format(this.settings.yearFormat);

		for (let monthNumber = 0; monthNumber < 12; monthNumber++) {
			const dateOfMonth = moment(
				`${year}-${(monthNumber + 1).toString().padStart(2, "0")}-01`
			);
			const currentMonth = dateOfMonth
				.month(monthNumber)
				.format(this.settings.monthFormat);

			// Don't backfill for future months
			if (moment().get("month") < monthNumber) {
				continue;
			}

			if (
				this.settings.dailyNotesBackfill === BackFillOptions.MONTH ||
				this.settings.dailyNotesBackfill === BackFillOptions.NONE
			) {
				if (
					currentMonth !== moment().format(this.settings.monthFormat)
				) {
					continue;
				}
			}

			const dayOfMonthFilePath =
				dateOfMonth.format(this.dailyFileFormat) + ".md";
			const monthsFolderPath = path.dirname(dayOfMonthFilePath);

			// Get all the files in the month folder
			const filesInFolder = this.app.vault.getFiles().filter((file) => {
				let folderPath = path.join(
					this.settings.rootFolder,
					monthsFolderPath
				);
				if (folderPath.startsWith("/")) {
					folderPath = folderPath.slice(1);
				}
				return file.path.startsWith(folderPath);
			});

			const daysInMonth = moment().daysInMonth();
			// Make sure there is an entry for each day of the month
			for (let day = 1; day <= daysInMonth; day++) {
				const dayDate = moment(`${year}-${monthNumber + 1}-${day}`);

				// If we are in the current month, only add entires up to today
				if (
					currentMonth === moment().format(this.settings.monthFormat)
				) {
					if (dayDate.date() > moment().date()) {
						continue;
					}
				}

				// Check if file exists for month
				let hasFileForDay = false;
				for (const file of filesInFolder) {
					const fileDayPart = file.basename.split("-")[0].trim();
					if (
						fileDayPart === dayDate.format(this.settings.dayFormat)
					) {
						hasFileForDay = true;
					}
				}
				if (hasFileForDay) {
					continue;
				}

				// If backfill is set to NONE, don't create for days before today
				if (
					this.settings.dailyNotesBackfill === BackFillOptions.NONE &&
					dayDate.date() < moment().date()
				) {
					continue;
				}

				// Create the file for the day
				const newFilePath = dayDate.format(this.dailyFileFormat);
				await this.createNewFile(
					dayDate,
					newFilePath,
					templateContents,
					filesInFolder
				).catch((error) => {
					errorNotice(error.message);
				});
			}
		}
	}

	async createMonthlyNote() {
		let templateContents = "";
		if (this.settings.monthlyNotesTemplateFile) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${this.settings.monthlyNotesTemplateFile}.md`
			);
			if (!templateFile) {
				return new Notice(
					`Monthly notes template file not found in ${this.settings.monthlyNotesTemplateFile} ${APP_NAME}. Please update template file in the settings.`
				);
			}
			templateContents = await this.app.vault.read(templateFile as TFile);
		}

		const year = moment().format(this.settings.yearFormat);

		const dayOfMonthFilePath =
			moment().format(this.monthlyFileFormat) + ".md";
		const monthlyNotesFolderPath = path.dirname(dayOfMonthFilePath);

		// Get all the files in the month folder
		const filesInFolder = this.app.vault.getFiles().filter((file) => {
			let folderPath = path.join(
				this.settings.rootFolder,
				monthlyNotesFolderPath
			);
			if (folderPath.startsWith("/")) {
				folderPath = folderPath.slice(1);
			}

			return (
				file.path.startsWith(folderPath) &&
				(file?.parent?.name
					? file.parent.name === this.settings.monthlyNotesFolderName
					: true)
			);
		});

		for (let monthNumber = 0; monthNumber < 12; monthNumber++) {
			const monthDate = moment(
				`${year}-${(monthNumber + 1)
					.toString()
					.padStart(2, "0")}-${this.settings.monthlyNotesDayOfMonth
					.toString()
					.padStart(2, "0")}`
			);

			// Don't backfill for future months
			if (moment().get("month") < monthNumber) {
				continue;
			}

			// Only backfill for the current month if the backfill setting isn't set to YEAR
			if (this.settings.monthlyNotesBackfill !== BackFillOptions.YEAR) {
				if (
					monthDate.format(this.settings.monthFormat) !==
					moment().format(this.settings.monthFormat)
				) {
					continue;
				}
			}

			let hasFileForMonth = false;
			for (const file of filesInFolder) {
				const fileMonthPart = file.basename.split("-")[0].trim();
				if (
					fileMonthPart ===
					monthDate.format(this.settings.monthFormat)
				) {
					hasFileForMonth = true;
				}
			}
			if (hasFileForMonth) {
				continue;
			}

			// Don't create for day of month if before this.settings.monthlyNotesDayOfMonth
			if (
				moment().date() < this.settings.monthlyNotesDayOfMonth &&
				monthNumber === moment().month()
			) {
				continue;
			}

			// Create the file for the day
			const newFilePath = monthDate.format(this.monthlyFileFormat);
			await this.createNewFile(
				monthDate,
				newFilePath,
				templateContents,
				filesInFolder
			).catch((error) => {
				errorNotice(error.message);
			});
		}
	}

	async createNewFile(
		createdDate: Moment,
		newFilePath: string,
		templateContents: string,
		filesInFolder: TFile[]
	) {
		if (!newFilePath.endsWith(".md")) {
			newFilePath += ".md";
		}
		newFilePath = path.join(this.settings.rootFolder, newFilePath);
		let folderPath = path.dirname(newFilePath);

		if (folderPath.startsWith("/")) {
			folderPath = folderPath.slice(1);
		}

		// Check if the folder exists, if not, create it
		if (!this.app.vault.getAbstractFileByPath(folderPath)) {
			let prevPath = "";
			folderPath.split(path.sep).forEach((folderName) => {
				const cascadePath = path.join(prevPath, folderName);
				if (!this.app.vault.getAbstractFileByPath(cascadePath)) {
					this.app.vault.createFolder(cascadePath);
				}
				prevPath = cascadePath;
			});
		}

		// Check if the file exists for day, if not, create it
		const dayPart = path.basename(newFilePath).split("-")[0].trim();
		let existingFile = undefined;
		for (const file of filesInFolder) {
			const existingDayPart = file.basename.split("-")[0].trim();
			if (existingDayPart === dayPart) {
				existingFile = file;
				break;
			}
		}

		if (
			this.settings.shouldTemplateDate &&
			templateContents.includes(this.settings.templateDateToken)
		) {
			templateContents = templateContents.replace(
				this.settings.templateDateToken,
				createdDate.format(this.settings.templateDateFormat)
			);
		}

		if (!existingFile) {
			await this.app.vault.create(newFilePath, templateContents);
		}
	}
}
