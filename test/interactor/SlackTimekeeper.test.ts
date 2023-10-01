import SlackTimekeeper, {SlackDataAccess} from "../../src/interactor/SlackTimekeeper";
import WorkDay from "../../src/entity/WorkDay";
import Employee from "../../src/entity/Employee";


const testEmployee: Employee = {
    isManager: false,
    id: 'employee123',
    shift: {
        end: new Date('2023-09-30T16:00:00'),
        start: new Date('2023-09-30T08:00:00'),
    },
    breaks: [
        {
            end: new Date('2023-09-30T10:15:00'),
            start: new Date('2023-09-30T10:00:00'),
        },
        {
            end: new Date('2023-09-30T12:45:00'),
            start: new Date('2023-09-30T12:30:00'),
        },
    ],
};

const testManager: Employee = {
    isManager: true,
    id: 'manager321',
    shift: {
        end: new Date('2023-09-30T16:00:00'),
        start: new Date('2023-09-30T08:00:00'),
    },
    breaks: [
        {
            end: new Date('2023-09-30T12:45:00'),
            start: new Date('2023-09-30T12:30:00'),
        },
    ],
};

class MockDataAccess implements SlackDataAccess {
    private readonly workDayShift: Timespan;
    private readonly workDayBreaks: Array<Timespan>;

    constructor(workDayShift: Timespan, workDayBreaks: Array<Timespan>) {
        this.workDayShift = workDayShift;
        this.workDayBreaks = workDayBreaks;
    }

    updateWorkDay(workDay: WorkDay) {
    }

    public getWorkDayByEmployee(employeeId: string): WorkDay {
        if (employeeId === testEmployee.id) {
            return {
                date: new Date(),
                employee: testEmployee,
                shift: this.workDayShift,
                breaks: this.workDayBreaks,
            };
        } else if (employeeId === testManager.id) {
            return {
                date: new Date(),
                employee: testManager,
                shift: this.workDayShift,
                breaks: this.workDayBreaks,
            };
        }
        throw new Error(`Employee ${employeeId} not found!`);
    }
}

describe('SlackTimekeeper', () => {
    it('should handle correct shift end', () => {
        const workDayShift = {
            end: null,
            start: new Date('2023-09-30T08:00:00'),
        };
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(dataAccess);
        const updateWorkDaySpy = jest.spyOn(dataAccess, 'updateWorkDay');
        const getWorkDayByEmployee = jest.spyOn(dataAccess, 'getWorkDayByEmployee');
        const output = timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T16:00:00')
        });
        expect(output.message).toBeNull();
        expect(updateWorkDaySpy).toHaveBeenCalled();
        expect(output.workDay.employee).toEqual(testEmployee);
        expect(getWorkDayByEmployee).toHaveBeenCalledWith("employee123");
        expect(output.workDay.shift.end).toEqual(new Date('2023-09-30T16:00:00'));
        expect(output.workDay.shift.start).toEqual(new Date('2023-09-30T08:00:00'));
    });

    it('should handle non started shift end', () => {
        const workDayShift = {
            end: null,
            start: null,
        };
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(dataAccess);
        const updateWorkDaySpy = jest.spyOn(dataAccess, 'updateWorkDay');
        const getWorkDayByEmployee = jest.spyOn(dataAccess, 'getWorkDayByEmployee');
        const output = timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T16:00:00')
        });
        expect(output.message).toBe("Shift has ended before start");
        expect(updateWorkDaySpy).toHaveBeenCalled();
        expect(output.workDay.employee).toEqual(testEmployee);
        expect(getWorkDayByEmployee).toHaveBeenCalledWith("employee123");
        expect(output.workDay.shift.end).toEqual(new Date('2023-09-30T16:00:00'));
        expect(output.workDay.shift.start).toEqual(new Date('2023-09-30T16:00:00'));
    });

    it('should handle repeated shift end', () => {
        const workDayShift = {
            end: new Date('2023-09-30T12:00:00'),
            start: new Date('2023-09-30T08:00:00'),
        };
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(dataAccess);
        const updateWorkDaySpy = jest.spyOn(dataAccess, 'updateWorkDay');
        const getWorkDayByEmployee = jest.spyOn(dataAccess, 'getWorkDayByEmployee');
        const output = timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T16:00:00')
        });
        expect(output.message).toBe("Repeated shift end");
        expect(updateWorkDaySpy).toHaveBeenCalled();
        expect(output.workDay.employee).toEqual(testEmployee);
        expect(getWorkDayByEmployee).toHaveBeenCalledWith("employee123");
        expect(output.workDay.shift.end).toEqual(new Date('2023-09-30T16:00:00'));
        expect(output.workDay.shift.start).toEqual(new Date('2023-09-30T08:00:00'));
    });

    it('should handle early ended shift', () => {
        const workDayShift = {
            end: null,
            start: new Date('2023-09-30T08:00:00'),
        };
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(dataAccess);
        const updateWorkDaySpy = jest.spyOn(dataAccess, 'updateWorkDay');
        const getWorkDayByEmployee = jest.spyOn(dataAccess, 'getWorkDayByEmployee');
        const output = timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T15:40:00')
        });
        expect(output.message).toBe("Shift is ending earlier than expected");
        expect(updateWorkDaySpy).toHaveBeenCalled();
        expect(output.workDay.employee).toEqual(testEmployee);
        expect(getWorkDayByEmployee).toHaveBeenCalledWith("employee123");
        expect(output.workDay.shift.end).toEqual(new Date('2023-09-30T15:40:00'));
        expect(output.workDay.shift.start).toEqual(new Date('2023-09-30T08:00:00'));
    });

    it('should handle late ended shift', () => {
        const workDayShift = {
            end: null,
            start: new Date('2023-09-30T08:00:00'),
        };
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(dataAccess);
        const updateWorkDaySpy = jest.spyOn(dataAccess, 'updateWorkDay');
        const getWorkDayByEmployee = jest.spyOn(dataAccess, 'getWorkDayByEmployee');
        const output = timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T16:30:00')
        });
        expect(output.message).toBe("Shift is ending later than expected");
        expect(updateWorkDaySpy).toHaveBeenCalled();
        expect(output.workDay.employee).toEqual(testEmployee);
        expect(getWorkDayByEmployee).toHaveBeenCalledWith("employee123");
        expect(output.workDay.shift.end).toEqual(new Date('2023-09-30T16:30:00'));
        expect(output.workDay.shift.start).toEqual(new Date('2023-09-30T08:00:00'));
    });

});
