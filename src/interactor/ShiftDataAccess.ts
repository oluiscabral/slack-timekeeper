import Shift from "../entity/Shift";

export default interface ShiftDataAccess {
    getShiftById(id: number): Promise<Shift>;

    createShift(shift: Shift): Promise<Shift>;

    updateShift(shift: Shift): Promise<Shift>;

    deleteShiftById(id: number): Promise<void>;

}