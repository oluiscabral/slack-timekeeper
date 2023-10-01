import {SlackDataAccess} from "../interactor/SlackTimekeeper";
import WorkDay from "../entity/WorkDay";

class SlackTimekeeperSQLite implements SlackDataAccess {

    public updateWorkDay(workDay: WorkDay): void {
    }


    public getWorkDayByEmployee(employeeId: string): WorkDay {
        return undefined;
    }

}