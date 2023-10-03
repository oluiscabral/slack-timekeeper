# Slack Timekeeper

## Installation & Setup

### Clone the Repository

```bash
git clone [repository_url]
cd [repository_name]
```

### Install Dependencies

```bash
npm install
```

### Setup Environment Variables

Create a `.env` file in the root of your project and insert your Slack Bot token and Signing secret.

```env
BOT_TOKEN=your_bot_token
SIGNING_SECRET=your_signing_secret
```

### Application Start

Start the application by running:

```bash
npm start
```

Your console should output: "Bot is running".

## Usage

Configure Slack commands to interact with the bot, utilizing the following predefined commands:

- Start Shift: "hi"
- End Shift: "bye"
- Start Break: "brb"
- End Break: "back"

The commands are customizable in the `listenerTimekeeperConfig` object.

## Testing

```bash
npm test
```