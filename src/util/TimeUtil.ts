export function getMinutesDifference(date1: Date, date2: Date) {
    const differenceInMilliseconds = date2.getTime() - date1.getTime();
    return Math.round(differenceInMilliseconds / (1000 * 60));
}