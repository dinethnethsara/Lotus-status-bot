const figlet = require('figlet');
const fs = require('fs-extra');
const path = require('path');

// Available figlet fonts
const availableFonts = [
  'Standard', 'Big', 'Slant', 'Small', 'Block', 'Lean',
  'Shadow', 'Digital', 'Graffiti', 'ANSI Shadow', 'Doom',
  'Small Slant', 'Sub-Zero', 'Star Wars', 'Script'
];

// Style text with figlet
const styleText = (text, fontName = 'Standard') => {
  return new Promise((resolve, reject) => {
    // Validate font exists, default to Standard if not
    const font = availableFonts.includes(fontName) ? fontName : 'Standard';
    
    figlet.text(text, {
      font: font,
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    }, (err, data) => {
      if (err) {
        console.error('Error generating styled text:', err);
        resolve(text);
        return;
      }
      resolve('```\n' + data + '\n```');
    });
  });
};

// Generate menu with styled fonts
const generateMenu = async (config) => {
  const { BOT_NAME, PREFIX } = config;
  
  const header = await styleText(BOT_NAME, 'Big');
  const menuTitle = await styleText('MENU', 'Slant');
  
  const menuCategories = [
    {
      title: '🤖 Bot Commands',
      items: [
        `${PREFIX}alive - Check if bot is running`,
        `${PREFIX}menu - Display this menu`,
        `${PREFIX}ping - Check bot response time`,
        `${PREFIX}info - Show bot information`
      ]
    },
    {
      title: '📱 Status Commands',
      items: [
        `${PREFIX}save - Save current status (owner only)`,
        `${PREFIX}savestatus - Alternative command to save status`,
        `${PREFIX}statuslist - List all saved statuses`,
        `${PREFIX}clearstatus - Clear saved statuses (owner only)`
      ]
    },
    {
      title: '⚙️ Settings',
      items: [
        `${PREFIX}setfont [fontname] - Change menu font style`,
        `${PREFIX}fonts - List available fonts`,
        `${PREFIX}toggleauto - Toggle auto-reaction (owner only)`
      ]
    }
  ];
  
  let menuText = `${header}\n\n${menuTitle}\n\n`;
  
  menuCategories.forEach(category => {
    menuText += `*${category.title}*\n`;
    category.items.forEach(item => {
      menuText += `- ${item}\n`;
    });
    menuText += '\n';
  });
  
  menuText += `\n*Powered by Lotus Mansion*\n`;
  menuText += `_WhatsApp Status Bot v1.0.0_`;
  
  return menuText;
};

// Generate status save menu
const generateSaveMenu = async (config) => {
  const { PREFIX } = config;
  
  const header = await styleText('Status Saver', 'Shadow');
  
  const saveText = `${header}\n\n`
    + `*How to Save a Status:*\n`
    + `1. View a status update\n`
    + `2. Reply to the status with *${PREFIX}save*\n`
    + `3. The bot will download and save the status\n\n`
    + `*Commands:*\n`
    + `- ${PREFIX}save - Save a status (reply to status)\n`
    + `- ${PREFIX}statuslist - List all saved statuses\n`
    + `- ${PREFIX}clearstatus - Delete all saved statuses\n\n`
    + `*Note:* Only the bot owner can save statuses.\n\n`
    + `_Powered by Lotus Mansion_`;
  
  return saveText;
};

// List all available fonts
const listFonts = async () => {
  const header = await styleText('Available Fonts', 'Standard');
  
  let fontText = `${header}\n\n`;
  fontText += availableFonts.map((font, index) => `${index+1}. ${font}`).join('\n');
  fontText += '\n\n_Powered by Lotus Mansion_';
  
  return fontText;
};

// Export functions
module.exports = {
  styleText,
  generateMenu,
  generateSaveMenu,
  listFonts,
  availableFonts
};