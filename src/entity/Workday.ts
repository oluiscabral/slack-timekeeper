import Shift from "./Shift";
import Break from "./Break";
import Employee from "./Employee";

export default interface Workday {
    id: number | undefined;
    date: Date;
    shift: Shift;
    employee: Employee;
    breaks: Array<Break>;
}