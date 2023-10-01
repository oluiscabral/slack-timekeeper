import WorkDay from "../entity/WorkDay";
import {getMinutesDifference} from "../util/TimeUtil";


export interface SlackDataAccess {

    updateWorkDay(workDay: WorkDay): void;

    getWorkDayByEmployee(employeeId: string): WorkDay;

}

interface SlackTimekeeperOutput {
    date: Date;
    workDay: WorkDay;
    message: string | null;
}

interface SlackTimekeeperRequest {
    date: Date;
    employeeId: string;
}

interface SlackTimekeeperResource {
    date: Date;
    workDay: WorkDay;
}

export default class SlackTimekeeper {

    private dataAccess: SlackDataAccess

    constructor(dataAccess: SlackDataAccess) {
        this.dataAccess = dataAccess;
    }

    public shiftEnd(request: SlackTimekeeperRequest): SlackTimekeeperOutput {
        const workDay = this.dataAccess.getWorkDayByEmployee(request.employeeId);
        const message = this.getShiftEndMessage({
            workDay: workDay,
            date: request.date
        });
        workDay.shift.end = request.date;
        this.dataAccess.updateWorkDay(workDay);
        return {
            date: new Date(),
            workDay: workDay,
            message: message
        };
    }

    private getShiftEndMessage(resource: SlackTimekeeperResource): string | null {
        if (!this.hasShiftStarted(resource)) {
            return "Shift has ended before start";
        } else if (this.hasShiftAlreadyEnded(resource)) {
            return "Repeated shift end";
        } else if (this.isShiftEndingBeforeExpectation(resource)) {
            return "Shift is ending earlier than expected";
        } else if (this.isShiftEndingAfterExpectation(resource)) {
            return "Shift is ending later than expected";
        }
        return null;
    }

    private hasShiftStarted(resource: SlackTimekeeperResource) {
        return resource.workDay.shift.start !== null;
    }

    private hasShiftAlreadyEnded(resource: SlackTimekeeperResource) {
        return resource.workDay.shift.end !== null;
    }

    private isShiftEndingBeforeExpectation(resource: SlackTimekeeperResource) {
        const realEnd = resource.date;
        const workDay = resource.workDay;
        const idealEnd = workDay.employee.shift.end;
        const minutesDiff = getMinutesDifference(realEnd, idealEnd);
        return minutesDiff < -2;
    }

    private isShiftEndingAfterExpectation(resource: SlackTimekeeperResource) {
        const realEnd = resource.date;
        const workDay = resource.workDay;
        const idealEnd = workDay.employee.shift.end;
        const minutesDiff = getMinutesDifference(realEnd, idealEnd);
        return minutesDiff > 15;
    }

}