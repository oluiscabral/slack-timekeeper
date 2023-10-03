import dotenv from 'dotenv';
import {App} from '@slack/bolt';
import BreakSQLite from "./data_access/BreakSQLite";
import {resolve as pathResolve} from "path";
import ShiftSQLite from "./data_access/ShiftSQLite";
import EmployeeSQLite from "./data_access/EmployeeSQLite";
import WorkdaySQLite from "./data_access/WorkdaySQLite";
import Timekeeper from "./interactor/Timekeeper";
import TimekeeperListener from "./listener/TimekeeperListener";

dotenv.config();

const app = new App({
    token: process.env.BOT_TOKEN!,
    signingSecret: process.env.SIGNING_SECRET!,
});

const databasePath = pathResolve(__dirname, '..', 'database');
const shiftDataAccess = new ShiftSQLite(databasePath);
const breakDataAccess = new BreakSQLite(databasePath);
const employeeDataAccess = new EmployeeSQLite(databasePath, shiftDataAccess, breakDataAccess);
const workdayDataAccess = new WorkdaySQLite(databasePath, shiftDataAccess, breakDataAccess, employeeDataAccess);
const timekeeper = new Timekeeper(workdayDataAccess);

const listenerTimekeeperConfig = {
    shiftEndCommand: "bye",
    breakEndCommand: "back",
    shiftStartCommand: "hi",
    breakStartCommand: "brb",
}
const listenerTimekeeper = new TimekeeperListener(app, timekeeper, listenerTimekeeperConfig);

listenerTimekeeper.setup();

(async () => {
    await app.start();
    console.log('Bot is running');
})();
