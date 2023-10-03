import dotenv from 'dotenv';
import {App} from '@slack/bolt';
import BreakSQLite from "./data_access/BreakSQLite";
import {resolve as pathResolve} from "path";
import ShiftSQLite from "./data_access/ShiftSQLite";
import EmployeeSQLite from "./data_access/EmployeeSQLite";
import WorkdaySQLite from "./data_access/WorkdaySQLite";
import Timekeeper from "./interactor/Timekeeper";

dotenv.config();

const app = new App({
    token: process.env.BOT_TOKEN!,
    signingSecret: process.env.SIGNING_SECRET!,
    endpoints: "/slack/commands"
});

const databasePath = pathResolve(__dirname, '..', 'database');
const shiftDataAccess = new ShiftSQLite(databasePath);
const breakDataAccess = new BreakSQLite(databasePath);
const employeeDataAccess = new EmployeeSQLite(databasePath, shiftDataAccess, breakDataAccess);
const workdayDataAccess = new WorkdaySQLite(databasePath, shiftDataAccess, breakDataAccess, employeeDataAccess);
const timekeeper = new Timekeeper(workdayDataAccess, employeeDataAccess, breakDataAccess);

app.command('/hi', async ({command, ack}) => {
    await ack();
    console.log(command);
    await timekeeper.shiftStart({date: new Date(), employeeId: command.user_id});
});

app.command('/bye', async ({command, ack}) => {
    await ack();
    console.log(command);
    await timekeeper.shiftEnd({date: new Date(), employeeId: command.user_id});
});

app.command('/brb', async ({command, ack}) => {
    await ack();
    console.log(command);
    await timekeeper.breakStart({date: new Date(), employeeId: command.user_id});
});

app.command('/back', async ({command, ack}) => {
    await ack();
    console.log(command);
    await timekeeper.breakEnd({date: new Date(), employeeId: command.user_id});
});

(async () => {
    await app.start();
    console.log('Bot is running!');
})();
