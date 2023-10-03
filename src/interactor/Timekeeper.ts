import Workday from "../entity/Workday";
import WorkdayDataAccess from "./WorkdayDataAccess";
import Break from "../entity/Break";


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

    private workdayDataAccess: WorkdayDataAccess;

    constructor(workdayDataAccess: WorkdayDataAccess) {
        this.workdayDataAccess = workdayDataAccess;
    }

    public async shiftEnd(request: TimekeeperRequest): Promise<TimekeeperOutput> {
        const workday = await this.workdayDataAccess.getEmployeeWorkday(request.employeeId);
        this.validateShiftEnd(workday);
        workday.shift.end = request.date;
        await this.workdayDataAccess.updateWorkday(workday);
        return {
            date: new Date(),
            workday: workday
        };
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

    public async breakEnd(request: TimekeeperRequest): Promise<TimekeeperOutput> {
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