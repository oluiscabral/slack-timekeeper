export function getMinutesDifference(date1: Date, date2: Date) {
    const differenceInMilliseconds = date2.getTime() - date1.getTime();
    return Math.round(differenceInMilliseconds / (1000 * 60));
}

export function getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}