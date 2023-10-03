import dotenv from 'dotenv';
import cron from 'node-cron';
import {AllMiddlewareArgs, App, SlackCommandMiddlewareArgs} from '@slack/bolt';
import BreakSQLite from "./data_access/BreakSQLite";
import {resolve as pathResolve} from "path";
import ShiftSQLite from "./data_access/ShiftSQLite";
import EmployeeSQLite from "./data_access/EmployeeSQLite";
import WorkdaySQLite from "./data_access/WorkdaySQLite";
import Timekeeper from "./interactor/Timekeeper";
import {WorkdayEvent} from "./entity/WorkdayEvent";
import axios from "axios";
import {StringIndexed} from "@slack/bolt/dist/types/helpers";

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

console.log("Creating command listeners...");

async function logEvent(res: SlackCommandMiddlewareArgs & AllMiddlewareArgs<StringIndexed>, event: WorkdayEvent) {
    try {
        const result = await res.client.users.info({
            user: res.command.user_id,
            token: process.env.SLACK_USER_TOKEN
        });
        const response = await axios.post(process.env.EVENT_TRACKING_API!, {
            operationName: "CreateTimeTrackingEvent",
            variables: {
                input: {
                    eventType: event.toString(),
                    workspaceId: res.command.team_id,
                    slackUserId: res.command.user_id,
                    timestamp: new Date().toISOString(),
                    slackUserEmail: result.user?.profile?.email,
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error creating event:', error);
    }
}

app.command('/hi', async (res) => {
    await res.ack();
    console.log(res.command);
    await timekeeper.shiftStart({date: new Date(), employeeId: res.command.user_id});
    await logEvent(res, WorkdayEvent.SHIFT_START);
});

app.command('/bye', async (res) => {
    await res.ack();
    console.log(res.command);
    await timekeeper.shiftEnd({date: new Date(), employeeId: res.command.user_id});
    await logEvent(res, WorkdayEvent.SHIFT_END);
});

app.command('/brb', async (res) => {
    await res.ack();
    console.log(res.command);
    await timekeeper.breakStart({date: new Date(), employeeId: res.command.user_id});
    await logEvent(res, WorkdayEvent.BREAK_START);
});

app.command('/back', async (res) => {
    await res.ack();
    console.log(res.command);
    await timekeeper.breakEnd({date: new Date(), employeeId: res.command.user_id});
    await logEvent(res, WorkdayEvent.BREAK_END);
});


(async () => {
    await app.start();
    console.log('Bot is running!');
})();

cron.schedule('* * * * *', async () => {
    try {
        console.log("Running scheduler...");
        const reminders = await timekeeper.getReminders();
        const managers = await employeeDataAccess.getAllManagers();
        reminders.startShift.forEach(employee => {
            app.client.chat.postMessage({
                channel: employee.id,
                token: process.env.BOT_TOKEN,
                text: 'Reminder: start your shift',
            });
            managers.forEach(manager => {
                app.client.chat.postMessage({
                    channel: manager.id,
                    token: process.env.BOT_TOKEN,
                    text: `Management: <@${employee.id}>! shift should have been started`,
                });
            })
        });
        reminders.endShift.forEach(employee => {
            app.client.chat.postMessage({
                channel: employee.id,
                token: process.env.BOT_TOKEN,
                text: 'Reminder: end your shift',
            });
            managers.forEach(manager => {
                app.client.chat.postMessage({
                    channel: manager.id,
                    token: process.env.BOT_TOKEN,
                    text: `Management: <@${employee.id}>! shift should have been terminated`,
                });
            })
        });
        reminders.startBreak.forEach(employee => {
            app.client.chat.postMessage({
                channel: employee.id,
                token: process.env.BOT_TOKEN,
                text: 'Reminder: take a break',
            });
            managers.forEach(manager => {
                app.client.chat.postMessage({
                    channel: manager.id,
                    token: process.env.BOT_TOKEN,
                    text: `Management: <@${employee.id}>! should take a break`,
                });
            })
        });
        reminders.endBreak.forEach(employee => {
            app.client.chat.postMessage({
                channel: employee.id,
                token: process.env.BOT_TOKEN,
                text: 'Reminder: end your break',
            });
            managers.forEach(manager => {
                app.client.chat.postMessage({
                    channel: manager.id,
                    token: process.env.BOT_TOKEN,
                    text: `Management: <@${employee.id}>! break should have been terminated`,
                });
            })
        });
    } catch (error) {
        console.error(`Error in sending message: ${error}`);
    }
});