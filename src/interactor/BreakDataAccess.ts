import Break from "../entity/Break";

export default interface BreakDataAccess {
    getBreakById(id: number): Promise<Break>;

    deleteBreakById(id: number): Promise<void>;

    createBreak(subject: Break): Promise<Break>;

    updateBreak(subject: Break): Promise<Break>;

    getWorkdayBreaks(workdayId: number): Promise<Array<Break>>;

    getEmployeeBreaks(employeeId: string): Promise<Array<Break>>;
}