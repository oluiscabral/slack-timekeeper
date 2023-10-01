export default interface Employee {
    id: string;
    isManager: boolean;
    shift: DefinedTimespan;
    breaks: Array<DefinedTimespan>;
}