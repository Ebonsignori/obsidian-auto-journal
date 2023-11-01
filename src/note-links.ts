import moment from "moment";
import { AutoJournalSettings } from "./settings/settings";
import { App, Notice } from "obsidian";
import { addMonthToDate, subtractMonthFromDate } from "./utils/date";

export function getJournalLink(
	app: App,
	settings: AutoJournalSettings,
	dailyOrMonthly: "daily" | "monthly",
	nextOrPrevious: "next" | "previous" | "today"
) {
	const currentFile = app.workspace.getActiveFile();
	let startDate = moment();
	if (currentFile?.path) {
		if (dailyOrMonthly === "daily") {
			startDate = getDateFromDailyNotePath(settings, currentFile?.path);
		} else if (dailyOrMonthly === "monthly") {
			startDate = getDateFromMonthlyNotePath(settings, currentFile?.path);
		}
	}

	// If current file doesn't provide a valid date, use today's date
	if (!startDate.isValid()) {
		startDate = moment();
	}

	let link;
	let adjustedDate;
	if (nextOrPrevious === "next") {
		adjustedDate =
			dailyOrMonthly === "daily"
				? startDate.clone().add(1, "day")
				: addMonthToDate(startDate);
	} else if (nextOrPrevious === "previous") {
		adjustedDate =
			dailyOrMonthly === "daily"
				? startDate.clone().subtract(1, "day")
				: subtractMonthFromDate(startDate);
	} else {
		adjustedDate = moment();
	}

	if (dailyOrMonthly === "daily") {
		link = getDailyJournalLinkForDay(app, settings, adjustedDate);
	} else if (dailyOrMonthly === "monthly") {
		link = getMonthlyJournalLinkForDay(app, settings, adjustedDate);
	}

	return link;
}

export function navigateToJournalLink(
	app: App,
	settings: AutoJournalSettings,
	link?: string
) {
	if (link) {
		app.workspace.openLinkText(link, "", settings.openNoteCommandInNewTab);
	}
}

export function getDateFromDailyNotePath(
	settings: AutoJournalSettings,
	filePath: string
): moment.Moment {
	const splitPath = filePath?.split("/");
	const day = splitPath?.[splitPath.length - 1].split("-")?.[0]?.trim();
	const month = splitPath?.[splitPath.length - 2];
	const year = splitPath?.[splitPath.length - 3];
	return moment(
		`${year}-${month}-${day}`,
		`${settings.yearFormat}-${settings.monthFormat}-${settings.dayFormat}`
	);
}

export function getDateFromMonthlyNotePath(
	settings: AutoJournalSettings,
	filePath: string
): moment.Moment {
	const splitPath = filePath?.split("/");
	const month = splitPath?.[splitPath.length - 1].split("-")?.[0]?.trim();
	const year = splitPath?.[splitPath.length - 3];
	return moment(
		`${year}-${month}-01`,
		`${settings.yearFormat}-${settings.monthFormat}-DD`
	);
}

export function getDailyJournalLinkForDay(
	app: App,
	settings: AutoJournalSettings,
	journalDate = moment()
): string {
	const noteFolder = `${settings.rootFolder}/${journalDate.format(
		settings.yearFormat
	)}/${journalDate.format(settings.monthFormat)}`;
	const noteDay = journalDate.format(settings.dayFormat);

	const dayFiles = app.vault.getFiles().filter((file) => {
		return file?.parent?.path === noteFolder;
	});

	let link;
	for (const file of dayFiles) {
		if (file.name.split("-")?.[0]?.trim() === noteDay) {
			link = file.path;
			break;
		}
	}

	if (!link) {
		new Notice(
			`Unable to find journal file for day ${noteDay} in ${noteFolder}. Is it created?`
		);
		return "";
	}

	return link;
}

export function getMonthlyJournalLinkForDay(
	app: App,
	settings: AutoJournalSettings,
	journalDate = moment()
): string {
	const noteFolder = `${settings.rootFolder}/${journalDate.format(
		settings.yearFormat
	)}/${settings.monthlyNotesFolderName}`;
	const noteMonth = journalDate.format(settings.monthFormat);

	const monthlyFiles = app.vault.getFiles().filter((file) => {
		return file?.parent?.path === noteFolder;
	});

	let link;
	for (const file of monthlyFiles) {
		if (file.name.split("-")?.[0]?.trim() === noteMonth) {
			link = file.path;
			break;
		}
	}

	if (!link) {
		new Notice(
			`Unable to find journal file for month ${noteMonth} in ${noteFolder}. Is it created?`
		);
		return "";
	}

	return link;
}
