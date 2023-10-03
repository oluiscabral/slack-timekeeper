import {Database} from 'sqlite3';
import Break from "../entity/Break";
import BreakDataAccess from "../interactor/BreakDataAccess";

interface BreakRow {
    id: number;
    end: string | undefined;
    start: string | undefined;
}

export default class BreakSQLite implements BreakDataAccess {
    private db: Database;

    constructor(databasePath: string) {
        this.db = new Database(databasePath);
    }

    public createBreak(subject: Break): Promise<Break> {
        const sql = `
            INSERT INTO break (start, end) 
            VALUES (?, ?)
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [subject.start?.toISOString(), subject.end?.toISOString()], function (err) {
                if (err) {
                    reject(err);
                }
                resolve({
                    ...subject,
                    id: this.lastID
                });
            });
        });
    }

    public getBreakById(id: number): Promise<Break> {
        const sql = `
            SELECT * FROM break WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [id], (err, row: BreakRow) => {
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
                reject(`Break with id ${id} not found`);
            });
        });
    }

    public updateBreak(subject: Break): Promise<Break> {
        const sql = `
            UPDATE break 
            SET start = ?, end = ?
            WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [subject.start?.toISOString(), subject.end?.toISOString(), subject.id], function (err) {
                if (err) {
                    reject(err);
                }
                resolve(subject);
            });
        });
    }

    public deleteBreakById(id: number): Promise<void> {
        const sql = `
            DELETE FROM break WHERE id = ?
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

    getWorkdayBreaks(workdayId: number): Promise<Array<Break>> {
        const sql = `
            SELECT break.* FROM break
            INNER JOIN workday_break
            ON workday_break.break_id = break.id
            AND workday_break.workday_id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.all(sql, [workdayId], (err, rows: Array<BreakRow>) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(row => {
                    return {
                        id: row.id,
                        end: row.end ? new Date(row.end) : undefined,
                        start: row.start ? new Date(row.start) : undefined,
                    }
                }));
            });
        });
    }

    getEmployeeBreaks(employeeId: string): Promise<Array<Break>> {
        const sql = `
            SELECT break.* FROM break
            INNER JOIN employee_break
            ON employee_break.break_id = break.id
            AND employee_break.employee_id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.all(sql, [employeeId], (err, rows: Array<BreakRow>) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(row => {
                    return {
                        id: row.id,
                        end: row.end ? new Date(row.end) : undefined,
                        start: row.start ? new Date(row.start) : undefined,
                    }
                }));
            });
        });
    }
}
