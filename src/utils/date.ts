import moment from "moment";

export function addMonthToDate(currentDate: moment.Moment): moment.Moment {
	let futureMonth = moment(currentDate).clone().add(1, "M");
	const futureMonthEnd = moment(futureMonth).endOf("month");

	if (
		currentDate.date() != futureMonth.date() &&
		futureMonth.isSame(futureMonthEnd.format("YYYY-MM-DD"))
	) {
		futureMonth = futureMonth.add(1, "d");
	}

	return futureMonth;
}

export function subtractMonthFromDate(
	currentDate: moment.Moment
): moment.Moment {
	let previousMonth = moment(currentDate).clone().subtract(1, "M");
	const previousMonthBegin = moment(previousMonth).startOf("month");

	if (
		currentDate.date() != previousMonth.date() &&
		previousMonth.isSame(previousMonthBegin.format("YYYY-MM-DD"))
	) {
		previousMonth = previousMonth.subtract(1, "d");
	}

	return previousMonth;
}
