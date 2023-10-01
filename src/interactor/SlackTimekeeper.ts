import WorkDay from "../entity/WorkDay";
import {getMinutesDifference} from "../util/TimeUtil";


export interface SlackNotifier {

    notifyAll(message: string): void;

}

export interface SlackDataAccess {

    updateWorkDay(workDay: WorkDay): void;

    getWorkDayByEmployee(employeeId: string): WorkDay;

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

    private notifier: SlackNotifier
    private dataAccess: SlackDataAccess

    constructor(notifier: SlackNotifier, dataAccess: SlackDataAccess) {
        this.notifier = notifier;
        this.dataAccess = dataAccess;
    }

    public shiftEnd(request: SlackTimekeeperRequest) {
        const workDay = this.dataAccess.getWorkDayByEmployee(request.employeeId);
        this.dataAccess.updateWorkDay({
            ...workDay,
            shift: {
                ...workDay.shift,
                end: request.date
            },
        });
        const resource: SlackTimekeeperResource = {
            date: request.date,
            workDay: workDay
        }
        this.handleShiftEndNotifications(resource);
    }

    private handleShiftEndNotifications(resource: SlackTimekeeperResource) {
        const {workDay} = resource;
        const {employee} = workDay;
        if (!this.hasShiftStarted(resource)) {
            this.notifier.notifyAll(`<@${employee.id}>! shift has ended before start`);
        } else if (this.hasShiftAlreadyEnded(resource)) {
            this.notifier.notifyAll(`<@${employee.id}>! repeated shift end`);
        } else if (this.isShiftEndingBeforeExpectation(resource)) {
            this.notifier.notifyAll(`<@${employee.id}>! shift is ending earlier than expected`);
        } else if (this.isShiftEndingAfterExpectation(resource)) {
            this.notifier.notifyAll(`<@${employee.id}>! shift is ending later than expected`);
        }
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
        return minutesDiff < 2;
    }

    private isShiftEndingAfterExpectation(resource: SlackTimekeeperResource) {
        const realEnd = resource.date;
        const workDay = resource.workDay;
        const idealEnd = workDay.employee.shift.end;
        const minutesDiff = getMinutesDifference(realEnd, idealEnd);
        return minutesDiff > 15;
    }
}