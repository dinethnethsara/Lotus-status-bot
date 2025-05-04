const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeInMemoryStore,
    downloadMediaMessage,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const menuHelper = require('./menuHelper');
require('dotenv').config();

// Configuration
const CONFIG = {
    SESSION_DIR: './session',
    MEDIA_DIR: './media',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '1234567890', // Change this in .env file
    BOT_NAME: process.env.BOT_NAME || 'Status Bot',
    PREFIX: process.env.PREFIX || '.',
    TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
    AUTO_REACT: process.env.AUTO_REACT === 'false' ? false : true,
    DEFAULT_FONT: process.env.DEFAULT_FONT || 'Standard'
};

// Create necessary directories
fs.ensureDirSync(CONFIG.SESSION_DIR);
fs.ensureDirSync(CONFIG.MEDIA_DIR);
fs.ensureDirSync(path.join(CONFIG.MEDIA_DIR, 'status'));

// Store to save messages history
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./baileys_store.json');
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10000);

// Format time
const formatTime = (timestamp) => {
    return moment(timestamp).tz(CONFIG.TIMEZONE).format('DD/MM/YY HH:mm:ss');
};

// Get all saved statuses
const getSavedStatuses = () => {
    const statusDir = path.join(CONFIG.MEDIA_DIR, 'status');
    return fs.readdirSync(statusDir).filter(file => 
        file.endsWith('.jpg') || file.endsWith('.mp4') || file.endsWith('.mp3')
    );
};

// Clear all saved statuses
const clearSavedStatuses = async () => {
    const statusDir = path.join(CONFIG.MEDIA_DIR, 'status');
    const files = getSavedStatuses();
    
    for (const file of files) {
        await fs.remove(path.join(statusDir, file));
    }
    
    return files.length;
};

// Start WhatsApp connection
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.SESSION_DIR);
    
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: 'silent' }),
    });
    
    store.bind(sock.ev);
    
    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('QR Code generated. Please scan with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
                
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot connected to WhatsApp!');
            console.log(await menuHelper.styleText(`${CONFIG.BOT_NAME} Online`, 'Big'));
        }
    });
    
    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);
    
    // Handle status updates
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
            if (!message.message) continue;
            
            // Auto view and react to statuses
            if (message.key.remoteJid === 'status@broadcast') {
                // Mark status as read
                await sock.readMessages([message.key]);
                console.log(`Viewed status from ${message.key.participant.split('@')[0]}`);
                
                // React with heart if auto-react is enabled
                if (CONFIG.AUTO_REACT) {
                    try {
                        await sock.sendMessage(
                            message.key.remoteJid, 
                            { 
                                react: { 
                                    text: '❤️', 
                                    key: message.key 
                                } 
                            }
                        );
                        console.log(`Reacted to status from ${message.key.participant.split('@')[0]}`);
                    } catch (error) {
                        console.error('Error reacting to status:', error);
                    }
                }
            }
        }
    });
    
    // Process messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            if (!message.message) continue;
            
            // Get the text content from the message
            const msgType = Object.keys(message.message)[0];
            let msgText = '';
            
            if (msgType === 'conversation') {
                msgText = message.message.conversation;
            } else if (msgType === 'extendedTextMessage') {
                msgText = message.message.extendedTextMessage.text;
            }
            
            // Only process commands with the prefix
            if (!msgText.startsWith(CONFIG.PREFIX)) continue;
            
            const cmd = msgText.slice(CONFIG.PREFIX.length).split(' ')[0].toLowerCase();
            const args = msgText.slice(CONFIG.PREFIX.length + cmd.length).trim().split(' ');
            const sender = message.key.remoteJid;
            const isOwner = sender.split('@')[0] === CONFIG.OWNER_NUMBER;
            
            console.log(`[COMMAND] ${cmd} from ${sender.split('@')[0]}`);
            
            // Process commands
            switch(cmd) {
                case 'alive': {
                    const aliveText = await menuHelper.styleText('I am alive!', 'Big');
                    const timestamp = formatTime(Date.now());
                    
                    await sock.sendMessage(sender, { 
                        text: `${aliveText}\n\n*Bot Status:* Online\n*Time:* ${timestamp}\n*Auto React:* ${CONFIG.AUTO_REACT ? 'Enabled' : 'Disabled'}\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'menu': {
                    const menuText = await menuHelper.generateMenu(CONFIG);
                    
                    await sock.sendMessage(sender, { text: menuText });
                    break;
                }
                
                case 'save':
                case 'savestatus': {
                    // Save status command - only works for owner
                    if (!isOwner) {
                        await sock.sendMessage(sender, { text: 'Only the bot owner can use this command.' });
                        break;
                    }
                    
                    // Check if this is a quoted message
                    if (!message.message.extendedTextMessage || !message.message.extendedTextMessage.contextInfo || !message.message.extendedTextMessage.contextInfo.quotedMessage) {
                        const saveMenuText = await menuHelper.generateSaveMenu(CONFIG);
                        await sock.sendMessage(sender, { text: saveMenuText });
                        break;
                    }

                    try {
                        // Get the quoted message
                        const quotedMsg = message.message.extendedTextMessage.contextInfo;
                        
                        if (quotedMsg.participant && quotedMsg.participant.includes('status')) {
                            const media = await downloadMediaMessage(
                                { key: { remoteJid: 'status@broadcast', fromMe: false, id: quotedMsg.stanzaId }, message: quotedMsg.quotedMessage },
                                'buffer',
                                {},
                                { logger: pino({ level: 'silent' }) }
                            );
                            
                            // Determine media type and file extension
                            let fileExt = '.jpg';
                            if (quotedMsg.quotedMessage.videoMessage) {
                                fileExt = '.mp4';
                            } else if (quotedMsg.quotedMessage.audioMessage) {
                                fileExt = '.mp3';
                            }
                            
                            // Generate filename with timestamp
                            const filename = `status_${Date.now()}${fileExt}`;
                            const filePath = path.join(CONFIG.MEDIA_DIR, 'status', filename);
                            
                            // Save the media file
                            await fs.writeFile(filePath, media);
                            
                            // Send confirmation
                            await sock.sendMessage(sender, { 
                                text: `✅ Status saved successfully as *${filename}*\n\n_Powered by Lotus Mansion_` 
                            });
                            
                            // Send the saved media back
                            if (fileExt === '.jpg') {
                                await sock.sendMessage(sender, { image: { url: filePath }, caption: 'Here is the saved status.' });
                            } else if (fileExt === '.mp4') {
                                await sock.sendMessage(sender, { video: { url: filePath }, caption: 'Here is the saved status.' });
                            } else if (fileExt === '.mp3') {
                                await sock.sendMessage(sender, { audio: { url: filePath } });
                            }
                        } else {
                            await sock.sendMessage(sender, { text: 'This is not a status message.' });
                        }
                    } catch (error) {
                        console.error('Error saving status:', error);
                        await sock.sendMessage(sender, { text: `Failed to save status: ${error.message}` });
                    }
                    break;
                }
                
                case 'statuslist': {
                    const files = getSavedStatuses();
                    
                    if (files.length === 0) {
                        await sock.sendMessage(sender, { text: 'No saved statuses found.' });
                        break;
                    }
                    
                    const statusListText = await menuHelper.styleText('Saved Statuses', 'Standard');
                    const fileList = files.map((file, index) => `${index + 1}. ${file}`).join('\n');
                    
                    await sock.sendMessage(sender, { 
                        text: `${statusListText}\n\n${fileList}\n\nTotal: ${files.length} status(es)\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'clearstatus': {
                    if (!isOwner) {
                        await sock.sendMessage(sender, { text: 'Only the bot owner can use this command.' });
                        break;
                    }
                    
                    const count = await clearSavedStatuses();
                    
                    await sock.sendMessage(sender, { 
                        text: `✅ Cleared ${count} saved status(es).\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'ping': {
                    const start = Date.now();
                    await sock.sendMessage(sender, { text: 'Pinging...' });
                    const end = Date.now();
                    
                    await sock.sendMessage(sender, { 
                        text: `🏓 Pong!\nResponse time: ${end - start}ms\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'info': {
                    const infoText = await menuHelper.styleText('Bot Info', 'Standard');
                    
                    await sock.sendMessage(sender, { 
                        text: `${infoText}\n\n*Bot Name:* ${CONFIG.BOT_NAME}\n*Prefix:* ${CONFIG.PREFIX}\n*Owner:* ${CONFIG.OWNER_NUMBER}\n*Auto React:* ${CONFIG.AUTO_REACT ? 'Enabled' : 'Disabled'}\n*Default Font:* ${CONFIG.DEFAULT_FONT}\n*Time Zone:* ${CONFIG.TIMEZONE}\n*Saved Statuses:* ${getSavedStatuses().length}\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'setfont': {
                    if (!isOwner) {
                        await sock.sendMessage(sender, { text: 'Only the bot owner can use this command.' });
                        break;
                    }
                    
                    const requestedFont = args[0];
                    
                    if (!requestedFont || !menuHelper.availableFonts.includes(requestedFont)) {
                        await sock.sendMessage(sender, { 
                            text: `Invalid font name. Use *${CONFIG.PREFIX}fonts* to see available fonts.` 
                        });
                        break;
                    }
                    
                    CONFIG.DEFAULT_FONT = requestedFont;
                    
                    const sampleText = await menuHelper.styleText('Font Changed!', requestedFont);
                    
                    await sock.sendMessage(sender, { 
                        text: `✅ Font changed to *${requestedFont}*\n\nSample:\n${sampleText}\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
                
                case 'fonts': {
                    const fontList = await menuHelper.listFonts();
                    
                    await sock.sendMessage(sender, { text: fontList });
                    break;
                }
                
                case 'toggleauto': {
                    if (!isOwner) {
                        await sock.sendMessage(sender, { text: 'Only the bot owner can use this command.' });
                        break;
                    }
                    
                    CONFIG.AUTO_REACT = !CONFIG.AUTO_REACT;
                    
                    await sock.sendMessage(sender, { 
                        text: `Auto-reaction to status ${CONFIG.AUTO_REACT ? 'enabled' : 'disabled'}.\n\n_Powered by Lotus Mansion_` 
                    });
                    break;
                }
            }
        }
    });
    
    return sock;
}

// Start the bot
console.log('Starting WhatsApp Status Bot...');
console.log('Powered by Lotus Mansion');
startBot();