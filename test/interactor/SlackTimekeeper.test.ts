import SlackTimekeeper, {SlackDataAccess, SlackNotifier} from "../../src/interactor/SlackTimekeeper";
import WorkDay from "../../src/entity/WorkDay";
import Employee from "../../src/entity/Employee";


const mockEmployee: Employee = {
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

const mockManager: Employee = {
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

class MockNotifier implements SlackNotifier {
    notifyAll(message: string) {
    }
}

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
        if (employeeId === mockEmployee.id) {
            return {
                date: new Date(),
                employee: mockEmployee,
                shift: this.workDayShift,
                breaks: this.workDayBreaks,
            };
        } else if (employeeId === mockManager.id) {
            return {
                date: new Date(),
                employee: mockManager,
                shift: this.workDayShift,
                breaks: this.workDayBreaks,
            };
        }
        throw new Error(`Employee ${employeeId} not found!`);
    }
}

describe('SlackTimekeeper', () => {
    it('should handle correct shift end 01', () => {
        const workDayShift = {
            end: null,
            start: new Date('2023-09-30T08:00:00'),
        };
        const notifier = new MockNotifier();
        const dataAccess = new MockDataAccess(workDayShift, []);
        const timekeeper = new SlackTimekeeper(notifier, dataAccess);

        const notifyAllSpy = jest.spyOn(notifier, 'notifyAll');

        timekeeper.shiftEnd({
            employeeId: "employee123",
            date: new Date('2023-09-30T08:00:00')
        });

        expect(notifyAllSpy).toHaveBeenCalledWith(
            `<@employee123>! shift has ended before start.`
        );
    });

});
