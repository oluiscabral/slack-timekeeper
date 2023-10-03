import {getMinutesDifference, getTodayDate} from "../../src/util/TimeUtil";

describe("TimeUtil", () => {
    describe('getMinutesDifference', () => {
        it('should calculate positive difference correctly', () => {
            const date1 = new Date('2023-09-30T14:30:00');
            const date2 = new Date('2023-09-30T15:45:00');
            const difference = getMinutesDifference(date1, date2);
            expect(difference).toBe(75); // 75 minutes difference between the two dates
        });

        it('should calculate negative difference correctly', () => {
            const date1 = new Date('2023-09-30T15:45:00');
            const date2 = new Date('2023-09-30T14:30:00');
            const difference = getMinutesDifference(date1, date2);
            expect(difference).toBe(-75); // -75 minutes difference between the two dates
        });

        it('should handle zero difference correctly', () => {
            const date1 = new Date('2023-09-30T14:30:00');
            const date2 = new Date('2023-09-30T14:30:00');
            const difference = getMinutesDifference(date1, date2);
            expect(difference).toBe(0); // 0 minutes difference between the two identical dates
        });
    });

    describe('getTodayDate', () => {
        it('should return the current date with time set to midnight', () => {
            const today = new Date();
            const result = getTodayDate();
            expect(result).toBeInstanceOf(Date);
            expect(result.getDate()).toBe(today.getDate());
            expect(result.getMonth()).toBe(today.getMonth());
            expect(result.getFullYear()).toBe(today.getFullYear());
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
            expect(result.getMilliseconds()).toBe(0);
        });
    });
});
