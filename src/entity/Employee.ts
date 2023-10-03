import Shift from "./Shift";
import Break from "./Break";

export default interface Employee {
    id: string;
    shift: Shift;
    isManager: boolean;
    breaks: Array<Break>;
}