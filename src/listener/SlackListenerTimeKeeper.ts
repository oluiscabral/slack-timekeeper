import {App as Slack, SlackCommandMiddlewareArgs} from "@slack/bolt";
import SlackTimekeeper from "../interactor/SlackTimekeeper";

interface SlackListenerTimeKeeperConfig {
    shiftEndCommandName: string;
    breakEndCommandName: string;
    shiftStartCommandName: string;
    breakStartCommandName: string;
}

class SlackListenerTimekeeper {
    private slack: Slack;
    public timekeeper: SlackTimekeeper;
    private config: SlackListenerTimeKeeperConfig;

    constructor(slack: Slack, config: SlackListenerTimeKeeperConfig, timekeeper: SlackTimekeeper) {
        this.slack = slack;
        this.config = config;
        this.timekeeper = timekeeper;
        this.setup();
    }

    private setup() {
        this.setupShiftEnd()
        this.setupBreakEnd()
        this.setupShiftStart()
        this.setupBreakStart()
    }


    private setupShiftEnd() {
        const commandName = this.config.shiftStartCommandName
        this.slack.command(commandName, this.shiftEndListener);
    }

    private setupBreakEnd() {

    }

    private setupShiftStart() {

    }

    private setupBreakStart() {

    }

    private async shiftEndListener(request: SlackCommandMiddlewareArgs) {
        await request.ack();
        const command = request.command;
        this.timekeeper.shiftEnd(command.user_id);
    }
}