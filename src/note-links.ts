import moment from "moment";
import { AutoJournalSettings } from "./settings/settings";
import { App, Notice } from "obsidian";

export function getDateFromNotePath(
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

export function getJournalLinkForDay(
	app: App,
	settings: AutoJournalSettings,
	journalDate = moment()
): string {
	const journalFolder = `${settings.rootFolder}/${journalDate.format(
		settings.yearFormat
	)}/${journalDate.format(settings.monthFormat)}`;
	const journalDay = journalDate.format(settings.dayFormat);

	const dayFiles = app.vault.getFiles().filter((file) => {
		return file?.parent?.path === journalFolder;
	});

	let link;
	for (const file of dayFiles) {
		if (file.name.split("-")?.[0]?.trim() === journalDay) {
			link = file.path;
			break;
		}
	}

	if (!link) {
		new Notice(
			`Unable to find journal file for day ${journalDay} in ${journalFolder}. Is it created?`
		);
		return "";
	}

	return link;
}

export function getNextDayJournalLink(
	startDate: moment.Moment,
	app: App,
	settings: AutoJournalSettings
): string {
	const nextDay = startDate.clone().add(1, "day");
	return getJournalLinkForDay(app, settings, nextDay);
}

export function getPreviousDayJournalLink(
	startDate: moment.Moment,
	app: App,
	settings: AutoJournalSettings
): string {
	const previousDay = startDate.clone().subtract(1, "day");
	return getJournalLinkForDay(app, settings, previousDay);
}
