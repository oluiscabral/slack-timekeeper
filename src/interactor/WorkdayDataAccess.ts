import Workday from "../entity/Workday";

export default interface WorkdayDataAccess {
    deleteWorkdayById(id: number): Promise<void>;

    getWorkdayById(id: number): Promise<Workday>;

    createWorkday(workday: Workday): Promise<Workday>;

    updateWorkday(workday: Workday): Promise<Workday>;

    getEmployeeWorkday(employeeId: string): Promise<Workday>;
}