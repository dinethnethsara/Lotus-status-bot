# WhatsApp Status Bot

A WhatsApp bot using the Baileys API that automatically views status updates, reacts with a heart emoji, and allows saving status updates with styled fonts for commands.

## ✨ Features

- **Auto-view WhatsApp statuses** - Never miss a status update again
- **Automatically react with heart emoji** - Show appreciation for all statuses
- **Save status updates** - Save images, videos, and audio from statuses
- **Styled font for commands** - Beautiful text displays for commands like `.alive` and `.menu`
- **Multiple font styles** - Choose from 15+ different font styles for the bot responses
- **Owner-only commands** - Only the bot owner can save statuses and change settings

## 📋 Commands

### 🤖 Bot Commands
- `.alive` - Check if bot is running
- `.menu` - Display the full menu
- `.ping` - Check bot response time
- `.info` - Show bot information

### 📱 Status Commands
- `.save` - Save current status (owner only, must be used as a reply to a status)
- `.savestatus` - Alternative command to save status
- `.statuslist` - List all saved statuses
- `.clearstatus` - Clear saved statuses (owner only)

### ⚙️ Settings
- `.setfont [fontname]` - Change menu font style
- `.fonts` - List available fonts
- `.toggleauto` - Toggle auto-reaction (owner only)

## 🛠️ Installation

### Prerequisites
- Node.js 16+ installed on your system
- A WhatsApp account for the bot
- Internet connection

### Setup Steps

1. Clone this repository:
```bash
git clone https://github.com/dinethnethsara/whatsapp-status-bot.git
cd whatsapp-status-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
   - Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit the `.env` file with your details:
   ```
   OWNER_NUMBER=1234567890  # Your WhatsApp number without + or spaces
   BOT_NAME=Status Bot
   PREFIX=.
   TIMEZONE=Asia/Kolkata
   AUTO_REACT=true
   DEFAULT_FONT=Standard
   ```

4. Start the bot:
```bash
npm start
```
or use the run script:
```bash
./run.sh
```

5. Scan the QR code that appears in the terminal with your WhatsApp to log in.

## 💾 How to Save Statuses

1. View a status in WhatsApp
2. Reply to the status with `.save`
3. The bot will download and save the status
4. You can view saved statuses with `.statuslist`

## 📝 Available Fonts

The bot supports multiple font styles for commands. Use `.fonts` to see the full list, including:
- Standard
- Big
- Slant
- Shadow
- Small
- Block
- Lean
- Digital
- Graffiti
- Doom
- Star Wars
- Script
- And more!

To change the font, use `.setfont [fontname]`. Example: `.setfont Shadow`

## 📂 File Structure

```
whatsapp-status-bot/
├── index.js          # Main bot file
├── menuHelper.js     # Menu and styled text functions
├── package.json      # Dependencies and scripts
├── run.sh            # Run script
├── .env              # Configuration
├── session/          # WhatsApp session data
└── media/
    └── status/       # Saved status files
```

## ⚠️ Notes

- The bot will automatically view all status updates
- The bot will automatically react with a heart to all status updates (can be disabled)
- Only the configured owner number can use the `.save` command
- Saved statuses are stored in the `./media/status` directory

## 🔒 Privacy & Security

- This bot requires a WhatsApp account to operate
- Your account will be shown as "online" when the bot is running
- The bot will have access to all your WhatsApp chats and contacts
- All data is stored locally on your device, not on remote servers

## 💻 Powered by Lotus Mansion

This bot is powered by Lotus Mansion.

## 📄 License

MIT
