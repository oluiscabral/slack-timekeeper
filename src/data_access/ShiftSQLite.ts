import {Database} from 'sqlite3';
import Shift from "../entity/Shift";
import ShiftDataAccess from "../interactor/ShiftDataAccess";

interface ShiftRow {
    id: number;
    end: string | undefined;
    start: string | undefined;
}

export default class ShiftSQLite implements ShiftDataAccess {
    private db: Database;

    constructor(databasePath: string) {
        this.db = new Database(databasePath);
    }

    public createShift(shift: Shift): Promise<Shift> {
        const sql = `
            INSERT INTO shift (start, end) 
            VALUES (?, ?)
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [shift.start?.toISOString(), shift.end?.toISOString()], function (err) {
                if (err) {
                    reject(err);
                }
                resolve({
                    ...shift,
                    id: this.lastID
                });
            });
        });
    }

    public getShiftById(id: number): Promise<Shift> {
        const sql = `
            SELECT * FROM shift WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [id], (err, row: ShiftRow) => {
                if (err) {
                    reject(err);
                }
                if (row) {
                    resolve({
                        id: row.id,
                        end: row.end ? new Date(row.end) : undefined,
                        start: row.start ? new Date(row.start) : undefined,
                    });
                }
                reject(`Shift with id ${id} not found`);
            });
        });
    }

    public updateShift(shift: Shift): Promise<Shift> {
        const sql = `
            UPDATE shift 
            SET start = ?, end = ?
            WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [shift.start?.toISOString(), shift.end?.toISOString(), shift.id], function (err) {
                if (err) {
                    reject(err);
                }
                resolve(shift);
            });
        });
    }

    public deleteShiftById(id: number): Promise<void> {
        const sql = `
            DELETE FROM shift WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
}
