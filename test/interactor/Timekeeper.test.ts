import Workday from "../../src/entity/Workday";
import Employee from "../../src/entity/Employee";
import Timekeeper, {TimekeeperError, TimekeeperOutput, TimekeeperRequest} from "../../src/interactor/Timekeeper";
import WorkdaySQLite from "../../src/data_access/WorkdaySQLite";
import ShiftDataAccess from "../../src/interactor/ShiftDataAccess";
import BreakDataAccess from "../../src/interactor/BreakDataAccess";
import EmployeeDataAccess from "../../src/interactor/EmployeeDataAccess";

jest.mock("../../src/data_access/WorkdaySQLite");

describe('Timekeeper', () => {
    const mockEmployee: Employee = {
        id: '12345',
        isManager: false,
        shift: {
            id: 1,
            start: new Date('2023-10-01T08:00:00Z'),  // Example date, adjust as needed
            end: new Date('2023-10-01T16:00:00Z')     // Example date, adjust as needed
        },
        breaks: [
            {
                id: 1,
                start: new Date('2023-10-01T10:00:00Z'),  // Example date, adjust as needed
                end: new Date('2023-10-01T10:15:00Z')     // Example date, adjust as needed
            },
            {
                id: 2,
                start: new Date('2023-10-01T12:00:00Z'),  // Example date, adjust as needed
                end: new Date('2023-10-01T12:30:00Z')     // Example date, adjust as needed
            }
        ]
    };
    let timekeeper: Timekeeper;
    let workdayDataAccess: jest.Mocked<WorkdaySQLite>;

    beforeEach(() => {
        workdayDataAccess = new WorkdaySQLite(
            'test-db-path',
            {} as ShiftDataAccess,
            {} as BreakDataAccess,
            {} as EmployeeDataAccess
        ) as jest.Mocked<WorkdaySQLite>;
        timekeeper = new Timekeeper(workdayDataAccess);
    });

    describe('shiftEnd', () => {
        test('should end shift successfully', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: '1'};
            const workday: Workday = {
                id: 1,
                breaks: [],
                date: new Date(),
                employee: mockEmployee,
                shift: {id: 1, start: new Date(), end: undefined}
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            const result: TimekeeperOutput = await timekeeper.shiftEnd(request);
            expect(result.workday.shift.end).toEqual(request.date);
            expect(workdayDataAccess.updateWorkday).toHaveBeenCalledWith(workday);
        });

        test('should throw shift has already been ended', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: '1'};
            const workday: Workday = {
                id: 1,
                breaks: [],
                date: new Date(),
                employee: mockEmployee,
                shift: {id: 1, start: new Date(), end: new Date()}
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.shiftEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });

        test('should throw shift has not started', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: '1'};
            const workday: Workday = {
                id: 1,
                breaks: [],
                date: new Date(),
                employee: mockEmployee,
                shift: {id: 1, start: undefined, end: undefined}
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.shiftEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });
    });

    describe('breakEnd', () => {
        test('should end break successfully', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: '1'};
            const workday: Workday = {
                id: 1,
                date: new Date(),
                employee: mockEmployee,
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: undefined}]
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            const result: TimekeeperOutput = await timekeeper.breakEnd(request);
            expect(result.workday.breaks[0].end).toEqual(request.date);
            expect(workdayDataAccess.updateWorkday).toHaveBeenCalledWith(workday);
        });

        test('should throw error if no break has started', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: '1'};
            const workday: Workday = {
                id: 1,
                date: new Date(),
                employee: mockEmployee,
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: new Date()}] // No open break (it's already ended)
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.breakEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });
    });
});
