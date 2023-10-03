import Workday from "../../src/entity/Workday";
import Employee from "../../src/entity/Employee";
import {getTodayDate} from "../../src/util/TimeUtil";
import BreakSQLite from "../../src/data_access/BreakSQLite";
import WorkdaySQLite from "../../src/data_access/WorkdaySQLite";
import EmployeeSQLite from "../../src/data_access/EmployeeSQLite";
import ShiftDataAccess from "../../src/interactor/ShiftDataAccess";
import Timekeeper, {TimekeeperError, TimekeeperOutput, TimekeeperRequest} from "../../src/interactor/Timekeeper";
import Break from "../../src/entity/Break";

jest.mock("../../src/data_access/BreakSQLite");
jest.mock("../../src/data_access/WorkdaySQLite");
jest.mock("../../src/data_access/EmployeeSQLite");

describe('Timekeeper', () => {
    const employee: Employee = {
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
    let breakDataAccess: jest.Mocked<BreakSQLite>;
    let workdayDataAccess: jest.Mocked<WorkdaySQLite>;
    let employeeDataAccess: jest.Mocked<EmployeeSQLite>;

    beforeEach(() => {
        const shiftDataAccess = {} as ShiftDataAccess;
        breakDataAccess = new BreakSQLite(
            'test-db-path'
        ) as jest.Mocked<BreakSQLite>;
        employeeDataAccess = new EmployeeSQLite(
            'test-db-path',
            shiftDataAccess,
            breakDataAccess,
        ) as jest.Mocked<EmployeeSQLite>;
        workdayDataAccess = new WorkdaySQLite(
            'test-db-path',
            shiftDataAccess,
            breakDataAccess,
            employeeDataAccess,
        ) as jest.Mocked<WorkdaySQLite>;
        timekeeper = new Timekeeper(workdayDataAccess, employeeDataAccess, breakDataAccess);
    });

    describe('shiftStart', () => {
        it('should start a shift for an employee and return workday data', async () => {
            const workday: Workday = {
                id: 1,
                date: getTodayDate(),
                employee: employee,
                shift: {
                    id: 1,
                    end: undefined,
                    start: new Date('2023-10-01T08:00:00Z'),
                },
                breaks: []
            };
            workdayDataAccess.createWorkday.mockResolvedValue(workday);
            employeeDataAccess.getEmployeeById.mockResolvedValue(employee);

            const request: TimekeeperRequest = {
                date: new Date(),
                employeeId: employee.id,
            };

            const result: TimekeeperOutput = await timekeeper.shiftStart(request);
            expect(workdayDataAccess.createWorkday).toHaveBeenCalled();
            expect(employeeDataAccess.getEmployeeById).toHaveBeenCalledWith(request.employeeId);
            expect(result).toEqual({

                date: expect.any(Date),
                workday: workday,
            });
        });
    });

    describe('shiftEnd', () => {
        test('should end shift successfully', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: employee.id};
            const workday: Workday = {
                id: 1,
                breaks: [],
                employee: employee,
                date: getTodayDate(),
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
                employee: employee,
                shift: {id: 1, start: new Date(), end: new Date()}
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.shiftEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });

        test('should throw shift has not started', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: employee.id};
            const workday: Workday = {
                id: 1,
                breaks: [],
                employee: employee,
                date: getTodayDate(),
                shift: {id: 1, start: undefined, end: undefined}
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.shiftEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });
    });

    describe('breakStart', () => {
        test('should start break successfully', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: employee.id};
            const workday: Workday = {
                id: 1,
                employee: employee,
                date: getTodayDate(),
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: new Date()}]
            };
            const subject: Break = {id: 1, start: new Date(), end: undefined};
            breakDataAccess.createBreak.mockResolvedValue(subject);
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            const result = await timekeeper.breakStart(request);
            expect(workdayDataAccess.updateWorkday).toHaveBeenCalledWith(workday);
            expect(result).toEqual({date: expect.any(Date), workday: workday});
            expect(workdayDataAccess.getEmployeeWorkday).toHaveBeenCalledWith(request.employeeId);
            expect(breakDataAccess.createBreak).toHaveBeenCalledWith({id: undefined, start: request.date, end: undefined});
        });

        test('should throw an error if the last break has not ended', async () => {
            const workday: Workday = {
                id: 1,
                employee: employee,
                date: getTodayDate(),
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: undefined}]
            };
            expect(() => timekeeper.validateBreakStart(workday)).toThrow(TimekeeperError);
        });
    });

    describe('breakEnd', () => {
        test('should end break successfully', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: employee.id};
            const workday: Workday = {
                id: 1,
                employee: employee,
                date: getTodayDate(),
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: undefined}]
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            const result: TimekeeperOutput = await timekeeper.breakEnd(request);
            expect(result.workday.breaks[0].end).toEqual(request.date);
            expect(workdayDataAccess.updateWorkday).toHaveBeenCalledWith(workday);
        });

        test('should throw error if no break has started', async () => {
            const request: TimekeeperRequest = {date: new Date(), employeeId: employee.id};
            const workday: Workday = {
                id: 1,
                employee: employee,
                date: getTodayDate(),
                shift: {id: 1, start: new Date(), end: undefined},
                breaks: [{id: 1, start: new Date(), end: new Date()}] // No open break (it's already ended)
            };
            workdayDataAccess.getEmployeeWorkday.mockResolvedValue(workday);

            await expect(timekeeper.breakEnd(request)).rejects.toBeInstanceOf(TimekeeperError);
        });
    });


});
