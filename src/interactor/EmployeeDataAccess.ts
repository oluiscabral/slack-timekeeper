import Employee from "../entity/Employee";

export default interface EmployeeDataAccess {
    getAllManagers(): Promise<Array<Employee>>;

    getAllEmployees(): Promise<Array<Employee>>;

    deleteEmployeeById(id: string): Promise<void>;

    getEmployeeById(id: string): Promise<Employee>;

    createEmployee(employee: Employee): Promise<Employee>;

    updateEmployee(employee: Employee): Promise<Employee>;


}