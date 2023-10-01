import WorkDay from "../entity/WorkDay";


export interface SlackDataAccess {

    updateWorkDay(workDay: WorkDay): void;

    getWorkDayByEmployee(employeeId: string): WorkDay;

}

interface SlackTimekeeperOutput {
    date: Date;
    workDay: WorkDay;
}

interface SlackTimekeeperRequest {
    date: Date;
    employeeId: string;
}

export class SlackTimekeeperError implements Error {
    name: string;
    message: string;

    constructor(message: string) {
        this.message = message;
        this.name = "SlackTimekeeperError";
    }

}

export default class SlackTimekeeper {

    private dataAccess: SlackDataAccess

    constructor(dataAccess: SlackDataAccess) {
        this.dataAccess = dataAccess;
    }

    public shiftEnd(request: SlackTimekeeperRequest): SlackTimekeeperOutput {
        const workDay = this.dataAccess.getWorkDayByEmployee(request.employeeId);
        this.validateShiftEnd(workDay);
        workDay.shift.end = request.date;
        this.dataAccess.updateWorkDay(workDay);
        return {
            date: new Date(),
            workDay: workDay
        };
    }

    private validateShiftEnd(workDay: WorkDay) {
        if (this.hasNotShiftStarted(workDay)) {
            throw new SlackTimekeeperError("Shift has not started yet!");
        }
        if (this.hasShiftAlreadyEnded(workDay)) {
            throw new SlackTimekeeperError("Shift has already been ended!");
        }
    }

    private hasNotShiftStarted(workDay: WorkDay) {
        return workDay.shift.start === null;
    }

    private hasShiftAlreadyEnded(workDay: WorkDay) {
        return workDay.shift.end !== null;
    }

    public breakEnd(request: SlackTimekeeperRequest) {
        const workDay = this.dataAccess.getWorkDayByEmployee(request.employeeId);
        const subject = workDay.breaks.pop()
        this.validateBreakEnd(subject);
        // @ts-ignore
        subject.end = request.date;
        // @ts-ignore
        workDay.breaks.push(subject);
        this.dataAccess.updateWorkDay(workDay);
        return {
            date: new Date(),
            workDay: workDay
        };
    }

    private isBreakOpen(subject: Timespan) {
        return subject.start !== null && subject.end === null;
    }

    private validateBreakEnd(subject: Timespan | undefined) {
        if (subject === undefined || subject.end !== null) {
            throw new SlackTimekeeperError("There is no open and started break!");
        }
    }
}