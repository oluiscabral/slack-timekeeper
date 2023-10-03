import Timekeeper from "../interactor/Timekeeper";
import {App as Slack, SlackCommandMiddlewareArgs} from "@slack/bolt";

interface ListenerTimekeeperConfig {
    shiftEndCommand: string;
    breakEndCommand: string;
    shiftStartCommand: string;
    breakStartCommand: string;
}

export default class TimekeeperListener {
    private slack: Slack;
    public timekeeper: Timekeeper;
    private config: ListenerTimekeeperConfig;

    constructor(slack: Slack, timekeeper: Timekeeper, config: ListenerTimekeeperConfig) {
        this.slack = slack;
        this.config = config;
        this.timekeeper = timekeeper;
    }

    public setup() {
        this.setupShiftEnd()
        this.setupBreakEnd()
    }

    private setupShiftEnd() {
        const commandName = this.config.shiftEndCommand
        this.slack.command(commandName, this.shiftEndListener);
    }

    private setupBreakEnd() {
        const commandName = this.config.shiftEndCommand
        this.slack.command(commandName, this.breakEndListener);
    }

    private async shiftEndListener(request: SlackCommandMiddlewareArgs) {
        await request.ack();
        await this.timekeeper.shiftEnd({date: new Date(), employeeId: request.command.user_id});
    }

    private async breakEndListener(request: SlackCommandMiddlewareArgs) {
        await request.ack();
        await this.timekeeper.breakEnd({date: new Date(), employeeId: request.command.user_id});
    }
}