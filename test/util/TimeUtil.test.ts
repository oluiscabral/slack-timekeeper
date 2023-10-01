import {getMinutesDifference} from "../../src/util/TimeUtil";

describe('getMinutesDifference function', () => {
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
