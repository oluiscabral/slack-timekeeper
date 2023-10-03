import {Database} from 'sqlite3';
import Employee from "../entity/Employee";
import ShiftDataAccess from "../interactor/ShiftDataAccess";
import BreakDataAccess from "../interactor/BreakDataAccess";
import EmployeeDataAccess from "../interactor/EmployeeDataAccess";

interface EmployeeRow {
    id: string,
    shift_id: number,
    is_manager: number
}

export default class EmployeeSQLite implements EmployeeDataAccess {
    private db: Database;
    public shiftDataAccess: ShiftDataAccess;
    public breakDataAccess: BreakDataAccess;

    constructor(databasePath: string, shiftDataAccess: ShiftDataAccess, breakDataAccess: BreakDataAccess) {
        this.db = new Database(databasePath);
        this.shiftDataAccess = shiftDataAccess;
        this.breakDataAccess = breakDataAccess;
    }

    public async createEmployee(employee: Employee): Promise<Employee> {
        employee.shift = await this.shiftDataAccess.createShift(employee.shift);
        employee.breaks = await Promise.all(employee.breaks.map(async subject => {
            return this.breakDataAccess.createBreak(subject);
        }));
        const insertedEmployee = await this.insertEmployee(employee);
        await this.linkEmployeeBreaks(insertedEmployee);
        return insertedEmployee;
    }

    private insertEmployee(employee: Employee): Promise<Employee> {
        const sql = `
            INSERT INTO employee (id, is_manager, shift_id) 
            VALUES (?, ?, ?)
        `;
        return new Promise<Employee>((resolve, reject) => {
            this.db.run(sql, [employee.id, +employee.isManager, employee.shift.id], function (err) {
                if (err) {
                    reject(err);
                }
                resolve(employee);
            });
        });
    }

    private async linkEmployeeBreaks(employee: Employee): Promise<void> {
        const sql = `
            INSERT INTO employee_break (employee_id, break_id) 
            VALUES (?, ?, ?)
        `;
        await Promise.all(
            employee.breaks.map(subject => {
                return new Promise((resolve, reject) => {
                    this.db.run(sql, [employee.id, subject.id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(subject);
                    });
                });
            })
        );
    }

    public getEmployeeById(id: string): Promise<Employee> {
        const sql = `
            SELECT * FROM employee WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [id], async (err, row: EmployeeRow) => {
                if (err) {
                    reject(err);
                }
                if (row) {
                    const breaks = await this.breakDataAccess.getEmployeeBreaks(id);
                    const shift = await this.shiftDataAccess.getShiftById(row.shift_id);
                    resolve({
                        id: row.id,
                        shift: shift,
                        breaks: breaks,
                        isManager: Boolean(row.is_manager)
                    });
                }
                reject(`Employee with id ${id} not found`);
            });
        });
    }

    public updateEmployee(employee: Employee): Promise<Employee> {
        const sql = `
            UPDATE employee 
            SET is_manager = ?, shift_id = ?
            WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [+employee.isManager, employee.shift.id, employee.id], async (err) => {
                if (err) {
                    reject(err);
                }
                employee.shift = await this.shiftDataAccess.updateShift(employee.shift);
                employee.breaks = await Promise.all(employee.breaks.map(async subject => {
                    return this.breakDataAccess.updateBreak(subject);
                }));
                resolve(employee);
            });
        });
    }

    public deleteEmployeeById(id: string): Promise<void> {
        const sql = `
            DELETE FROM employee WHERE id = ?
        `;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    public getAllManagers(): Promise<Array<Employee>> {
        const sql = `
            SELECT * FROM employee WHERE is_manager > 0
        `;
        return new Promise((resolve, reject) => {
            this.db.all(sql, async (err, rows: Array<EmployeeRow>) => {
                if (err) {
                    reject(err);
                }
                resolve(await Promise.all(rows.map(async (row) => {
                    const shift = await this.shiftDataAccess.getShiftById(row.shift_id);
                    const breaks = await this.breakDataAccess.getEmployeeBreaks(row.id);
                    return {
                        id: row.id,
                        shift: shift,
                        breaks: breaks,
                        isManager: Boolean(row.is_manager)
                    };
                })));
            });
        });
    }

    public getAllEmployees(): Promise<Array<Employee>> {
        const sql = `
            SELECT * FROM employee
        `;
        return new Promise((resolve, reject) => {
            this.db.all(sql, async (err, rows: Array<EmployeeRow>) => {
                if (err) {
                    reject(err);
                }
                resolve(await Promise.all(rows.map(async (row) => {
                    const shift = await this.shiftDataAccess.getShiftById(row.shift_id);
                    const breaks = await this.breakDataAccess.getEmployeeBreaks(row.id);
                    return {
                        id: row.id,
                        shift: shift,
                        breaks: breaks,
                        isManager: Boolean(row.is_manager)
                    };
                })));
            });
        });
    }
}
