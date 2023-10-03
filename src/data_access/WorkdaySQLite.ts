import {Database} from 'sqlite3';
import EmployeeDataAccess from "../interactor/EmployeeDataAccess";
import BreakDataAccess from "../interactor/BreakDataAccess";
import ShiftDataAccess from "../interactor/ShiftDataAccess";
import Workday from "../entity/Workday";
import WorkdayDataAccess from "../interactor/WorkdayDataAccess";

interface WorkdayRow {
    id: number;
    date: string;
    shift_id: number;
    employee_id: string;
}

export default class WorkdaySQLite implements WorkdayDataAccess {
    private db: Database;
    private shiftDataAccess: ShiftDataAccess;
    private breakDataAccess: BreakDataAccess;
    private employeeDataAccess: EmployeeDataAccess;

    constructor(
        databasePath: string,
        shiftDataAccess: ShiftDataAccess,
        breakDataAccess: BreakDataAccess,
        employeeDataAccess: EmployeeDataAccess,
    ) {
        this.db = new Database(databasePath);
        this.shiftDataAccess = shiftDataAccess;
        this.breakDataAccess = breakDataAccess;
        this.employeeDataAccess = employeeDataAccess;
    }

    public createWorkday(workday: Workday): Promise<Workday> {
        const sql = `
            INSERT INTO workday (date, shift_id, employee_id) 
            VALUES (?, ?, ?)
        `;
        return new Promise<Workday>((resolve, reject) => {
            this.db.run(sql, [workday.date, workday.shift.id, workday.employee.id], function (err) {
                if (err) {
                    reject(err);
                }
                resolve({
                    ...workday,
                    id: this.lastID
                });
            });
        });
    }

    public getWorkdayById(id: number): Promise<Workday> {
        const selectSql = `
            SELECT * FROM workday WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.get(selectSql, [id], async (err, row: WorkdayRow) => {
                if (err) {
                    reject(err);
                }
                if (row) {
                    const breaks = await this.breakDataAccess.getWorkdayBreaks(id);
                    const shift = await this.shiftDataAccess.getShiftById(row.shift_id);
                    const employee = await this.employeeDataAccess.getEmployeeById(row.employee_id);
                    resolve({
                        id: row.id,
                        shift,
                        breaks,
                        employee,
                        date: new Date(row.date)
                    });
                }
                reject(`Workday with id ${id} not found`);
            });
        });
    }

    public updateWorkday(workday: Workday): Promise<Workday> {
        const sql = `
            UPDATE workday 
            SET date = ?, shift_id = ?, employee_id = ?
            WHERE id = ?
        `;
        return new Promise<Workday>((resolve, reject) => {
            this.db.run(sql, [workday.date, workday.shift.id, workday.employee.id, workday.id], async (err) => {
                if (err) {
                    reject(err);
                }
                workday.shift = await this.shiftDataAccess.updateShift(workday.shift);
                workday.breaks = await Promise.all(workday.breaks.map(async subject => {
                    return this.breakDataAccess.updateBreak(subject);
                }));
                resolve(workday);
            });
        });
    }

    public deleteWorkdayById(id: number): Promise<void> {
        const sql = `
            DELETE FROM workday WHERE id = ?
        `;
        return new Promise<void>((resolve, reject) => {
            this.db.run(sql, [id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    getEmployeeWorkday(employeeId: string): Promise<Workday> {
        const sql = `SELECT * FROM workday WHERE employee_id = ?`;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [employeeId], async (err, row: WorkdayRow) => {
                if (err) {
                    reject(err);
                }
                if (row) {
                    const shift = await this.shiftDataAccess.getShiftById(row.shift_id);
                    const breaks = await this.breakDataAccess.getWorkdayBreaks(row.id);
                    const employee = await this.employeeDataAccess.getEmployeeById(row.employee_id);
                    resolve({
                        id: row.id,
                        shift,
                        breaks,
                        employee,
                        date: new Date(row.date)
                    });
                }
                reject(`Workday with employee id ${employeeId} not found`);
            });
        });
    }

}
