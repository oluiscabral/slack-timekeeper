import Workday from "../entity/Workday";
import Break from "../entity/Break";
import WorkdayDataAccess from "./WorkdayDataAccess";
import EmployeeDataAccess from "./EmployeeDataAccess";
import Shift from "../entity/Shift";
import {getTodayDate} from "../util/TimeUtil";
import BreakDataAccess from "./BreakDataAccess";


export interface TimekeeperOutput {
    date: Date;
    workday: Workday;
}

export interface TimekeeperRequest {
    date: Date;
    employeeId: string;
}

export class TimekeeperError implements Error {
    name: string;
    message: string;

    constructor(message: string) {
        this.message = message;
        this.name = "SlackTimekeeperError";
    }

}

export default class Timekeeper {

    private breakDataAccess: BreakDataAccess;
    private workdayDataAccess: WorkdayDataAccess;
    private employeeDataAccess: EmployeeDataAccess;

    constructor(workdayDataAccess: WorkdayDataAccess, employeeDataAccess: EmployeeDataAccess, breakDataAccess: BreakDataAccess) {
        this.breakDataAccess = breakDataAccess;
        this.workdayDataAccess = workdayDataAccess;
        this.employeeDataAccess = employeeDataAccess;
    }

    public async shiftStart(request: TimekeeperRequest): Promise<TimekeeperOutput> {
        console.log(`Shift start requested: ${request}`);
        await this.validateShiftStart(request);
        const employee = await this.employeeDataAccess.getEmployeeById(request.employeeId);
        const shift: Shift = {
            id: undefined,
            end: undefined,
            start: new Date(),
        }
        const workday: Workday = {
            id: undefined,
            breaks: [],
            shift: shift,
            employee: employee,
            date: getTodayDate(),
        }
        const createdWorkday = await this.workdayDataAccess.createWorkday(workday);
        return {
            date: new Date(),
            workday: createdWorkday
        }
    }

    public async validateShiftStart(request: TimekeeperRequest) {
        let workday = null;
        try {
            workday = await this.workdayDataAccess.getEmployeeWorkday(request.employeeId);
        } catch (error) {
            // pass
        }
        if (workday !== null) {
            throw new TimekeeperError("Shift has already started!");
        }
    }

    public async shiftEnd(request: TimekeeperRequest): Promise<TimekeeperOutput> {
        console.log(`Shift end requested: ${request}`);
        const workday = await this.getWorkday(request);
        this.validateShiftEnd(workday);
        workday.shift.end = request.date;
        await this.workdayDataAccess.updateWorkday(workday);
        return {
            date: new Date(),
            workday: workday
        };
    }

    private async getWorkday(request: TimekeeperRequest) {
        try {
            return await this.workdayDataAccess.getEmployeeWorkday(request.employeeId);
        } catch (error) {
            throw new TimekeeperError("Shift has not started yet!");
        }
    }

    private validateShiftEnd(workday: Workday) {
        if (this.hasNotShiftStarted(workday)) {
            throw new TimekeeperError("Shift has not started yet!");
        }
        if (this.hasShiftAlreadyEnded(workday)) {
            throw new TimekeeperError("Shift has already been ended!");
        }
    }

    private hasNotShiftStarted(workday: Workday) {
        return workday.shift.start === undefined;
    }

    private hasShiftAlreadyEnded(workday: Workday) {
        return workday.shift.end !== undefined;
    }

    public async breakStart(request: TimekeeperRequest): Promise<TimekeeperOutput> {
        console.log(`Break start requested: ${request}`);
        const workday = await this.workdayDataAccess.getEmployeeWorkday(request.employeeId);
        this.validateBreakStart(workday);
        const subject = await this.createBreak(request);
        workday.breaks.push(subject)
        await this.workdayDataAccess.updateWorkday(workday);
        return {
            date: new Date(),
            workday: workday
        };
    }

    public validateBreakStart(workday: Workday) {
        const lastBreak = workday.breaks.pop();
        if (lastBreak !== undefined && lastBreak.end === undefined) {
            throw new TimekeeperError("There is already a started break!");
        }
    }

    private async createBreak(request: TimekeeperRequest): Promise<Break> {
        const subject: Break = {
            id: undefined,
            end: undefined,
            start: request.date
        }
        return await this.breakDataAccess.createBreak(subject);
    }

    public async breakEnd(request: TimekeeperRequest): Promise<TimekeeperOutput> {
        console.log(`Break end requested: ${request}`);
        const workday = await this.workdayDataAccess.getEmployeeWorkday(request.employeeId);
        const subject = workday.breaks.pop()
        this.validateBreakEnd(subject);
        // @ts-ignore
        subject.end = request.date;
        // @ts-ignore
        workday.breaks.push(subject);
        await this.workdayDataAccess.updateWorkday(workday);
        return {
            date: new Date(),
            workday: workday
        };
    }

    private validateBreakEnd(subject: Break | undefined) {
        if (subject === undefined || subject.end !== undefined) {
            throw new TimekeeperError("There is no open and started break!");
        }
    }

}