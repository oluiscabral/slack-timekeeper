import dotenv from 'dotenv';
import {App} from '@slack/bolt';

dotenv.config();

const app = new App({
    token: process.env.BOT_TOKEN!,
    signingSecret: process.env.SIGNING_SECRET!,
});

app.command('/hello', async ({command, ack, say}) => {
    await ack();
    await say(`Hello, <@${command.user_id}>!`);
    command.team
});

(async () => {
    await app.start();
    console.log('Bot is running');
})();
