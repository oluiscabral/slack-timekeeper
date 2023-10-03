import Employee from "../entity/Employee";

export default interface EmployeeDataAccess {
    deleteEmployeeById(id: string): Promise<void>;

    getEmployeeById(id: string): Promise<Employee>;

    createEmployee(employee: Employee): Promise<Employee>;

    updateEmployee(employee: Employee): Promise<Employee>;
}