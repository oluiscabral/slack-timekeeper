import Employee from "./Employee";

export enum WorkDayEvent {
    SHIFT_END,
    BREAK_END,
    SHIFT_START,
    BREAK_START
}

export default interface WorkDay {
    date: Date;
    shift: Timespan;
    employee: Employee;
    breaks: Array<Timespan>;
}