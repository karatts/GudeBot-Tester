import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, DiscordRequest } from './utils.js';

import { patEmbed } from './commands/pat.js';
import { emotionalSupportResponse } from './commands/emotionalsupport.js';
import { wishlistMessage } from './commands/track/wishlist.js';
import { vday } from './commands/track/vday.js';
import { updateEasterTracking, eggHunt, updateBasket } from './commands/track/easter.js';
import { emoteTracking } from './commands/track/emote.js';

import { cardCodeGenerator, cardLookup, hideHelp } from './bot-interactions/keqing.js';

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method

const fs = require('node:fs');

const {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  IntentsBitField,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
});

const karutaUID = '646937666251915264'; //karuta bot id
const testerUID = '1040041183658922046';
let tracking;
let eggTracking;

client.once(Events.ClientReady, () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  tracking = JSON.parse(fs.readFileSync('./files/track.json'));
  eggTracking = JSON.parse(fs.readFileSync('./files/egg-track.json'));
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  let trackedChannels = Object.keys(tracking);
  if(trackedChannels.includes(newMessage.channelId)){
    // external bot responses
    //if(tracking[message.channelId].externalbot === 'enabled' && (message.content.startsWith('kc') || message.content.startsWith('k!collection') || message.content.startsWith('kcollection'))){
    
    if(tracking[newMessage.channelId].externalbot === 'enabled' && newMessage.author.id === karutaUID){
      if(newMessage.embeds[0] === undefined || newMessage.embeds[0] === null){
        return;
      } else {
        cardLookup(newMessage);
      }
    }  

  }
});

client.on("messageCreate", (message) => {
  console.log('writing in a server...');
  let trackedChannels = Object.keys(tracking);
  
  if(trackedChannels.includes(message.channelId)){
    console.log('Looking at a tracked channel ' + message.channelId);
    //const channel = message.client.channels.cache.find(channel => channel.id);
    
    // wishlist message
    if(message.author.id === karutaUID && tracking[message.channelId].wishlist === 'enabled' && message.content.includes('A card from your wishlist is dropping!')){
      wishlistMessage(message);
    }
    
    // external bot responses
    //if(tracking[message.channelId].externalbot === 'enabled' && (message.content.startsWith('kc') || message.content.startsWith('k!collection') || message.content.startsWith('kcollection'))){
    if(tracking[message.channelId].externalbot === 'enabled' && message.author.id === karutaUID){
      
      if(message.embeds[0] === undefined || message.embeds[0] === null){
        return;
      } else {
        cardCodeGenerator(message); // Adds mag emote to karuta kc response
        cardLookup(message);
        hideHelp(message); 
      }
    }
    
    //track vday
    if(tracking[message.channelId].event === 'vday'){
      vday(message, karutaUID, tracking);
    }
    //track easter
    if(tracking[message.channelId].event === 'easter'){
      if (message.content.toLowerCase() === 'gudegg'){
        // check eggs
        let eggUsers = Object.keys(eggTracking);
        let eggMessage = 'You are missing the following eggs: \n > ';
        if(eggUsers.includes(message.author.id)){
          eggTracking[message.author.id].eggNumbers.forEach((egg) => {
            eggMessage += egg + ' ';
          });
           message.channel.send(eggMessage);
          
          if(eggTracking[message.author.id].channels.length === 0){
            message.channel.send('Please type `gudegg track` if you want to receive pings for the eggs you\'re missing in this channel.');
          }
        } else {
          message.channel.send('Please type `kevent` and then `gudegg track` to get started!');
        }
      }
      
      if(message.content.toLowerCase() === 'gudegg track'){
        let eggUsers = Object.keys(eggTracking);
        if(eggUsers.includes(message.author.id)){
          if(eggTracking[message.author.id].channels.includes(message.channelId)){
            let eggTrackedChannels = eggTracking[message.author.id].channels;
            message.channel.send('Tracking removed from this channel');
            const index = eggTrackedChannels.indexOf(message.channelId);
            eggTrackedChannels.splice(index, 1);
            eggTracking[message.author.id].channels = eggTrackedChannels;
          } else {
            eggTracking[message.author.id].channels.push(message.channelId);
            message.channel.send("You are now tracking this channel.");
          }
        } else {
          message.channel.send('Please type `kevent` first and then `gudegg track`.')
        }
        const jsonString = JSON.stringify(eggTracking, null, 2); // write to file
        fs.writeFile('./files/egg-track.json', jsonString, err => {
          if (err) return console.log(err);
        });
      } 
      
       // Respond to kevent
      if(message.author.id === karutaUID) {
        // Respond to kevent
        if(message.embeds && message.embeds[0] && message.embeds[0].data && message.embeds[0].data.title === "Hamako's Springtide Shack"){
          eggTracking = updateEasterTracking(message, eggTracking);
          
          const jsonString = JSON.stringify(eggTracking, null, 2); // write to file
          fs.writeFile('./files/egg-track.json', jsonString, err => {
            if (err) return console.log(err);
          });
        }
        
        if(message.content.includes('dropping')){
          eggHunt(message, karutaUID, eggTracking);
        }
        if(message.content.includes('into your basket!')){
          eggTracking = updateBasket(message, eggTracking);
          if(eggTracking){
            const jsonString = JSON.stringify(eggTracking, null, 2); // write to file
            fs.writeFile('./files/egg-track.json', jsonString, err => {
              if (err) return console.log(err);
            });
          }
        }
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;
  
  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === "emotionalsupport") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: emotionalSupportResponse(req.body.member),
        },
      });
    }
        // "pat" guild command
    if (name === "pat") {
      let embedParts = patEmbed(client, req.body);
      let embed = embedParts.embed;
      embed.setImage(embedParts.image);

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [embed],
        },
      });
    }
    
    if (name === "emote tracking") {
      emoteTracking();
    }
    
    if (name === "track") {
      let channel = req.body.channel_id;
      let server = req.body.guild_id;
      
      let trackedChannels = Object.keys(tracking);
      
      // No filter selected; return values for this channel
      if("options" in req.body.data === false){
        
        if(trackedChannels.includes(channel)){
          let returnMessage = 'This channel is currently being tracked for: \n > Event: ';
          if(tracking[channel].event === 'vday'){
            returnMessage += '`Valentine\'s Day`';
          } else {
            returnMessage += '`'+tracking[channel].event+'`';
          }
          returnMessage += "\n > Wishlist Warning: `"+tracking[channel].wishlist+'`';
          returnMessage += "\n > External Bot Triggers: `"+tracking[channel].externalbot+'`';
          if(tracking[channel].testing === 'enabled'){
            returnMessage += "\n > Testing Channel: `"+tracking[channel].testing+'`';
          }
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: returnMessage,
            },
          });
        } else {
          return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "This channel has never been tracked before.",
          },
        });
        }
      }
      
      // No values by default
      let event = "none";
      let wishlist = "disabled";
      let extbot = "disabled";
      let testing = "disabled";
      let eventChange = false;
      let wlChange = false;
      let extBotChange = false;
      let testingChange = false;
      
      for(let i = 0; i < req.body.data.options.length; i++){

        let filter = req.body.data.options[i].name;

        switch(filter) {
          case 'event':
            event = req.body.data.options[i].value;
            //console.log('Tracking event: ' + event);
            eventChange = true;
            break;
          case 'wishlist':
            wishlist = req.body.data.options[i].value;
            //console.log('Wishlist tracking: ' + wishlist);
            wlChange = true;
            break;
          case 'externalbot':
            extbot = req.body.data.options[i].value;
            extBotChange = true;
            break;
          case 'testing':
            testing = req.body.data.options[i].value;
            //console.log('Testing tracking: ' + testing);
            testingChange = true;
            break;
          default:
            console.log('No filter match');
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Invalid Filter",
              },
            });
        }
      }
      
      if (trackedChannels.includes(channel)){
        // The channel is already being tracked - Just update the values
        if(eventChange){
          if (event === tracking[channel].event){
             //console.log("Event specified is already being tracked; No change");
            // Event specified is already being tracked; No change
            eventChange = false;
          } else {
            // Update event to new setting
            console.log("Update event to new setting");
            tracking[channel].event = event;
          }
        }
        if(wlChange){
          if (wishlist === tracking[channel].wishlist){
            // Wishlist setting already set
            //console.log("No change to wishlist warning setting");
            wlChange = false;
          } else {
            // Update wishlist setting
            //console.log("Update wishlist warning setting");
            tracking[channel].wishlist = wishlist;
          }
        }
        if(extBotChange){
          if (extbot === tracking[channel].externalbot){
            // Testing setting already set
            extBotChange = false;
            //console.log("No change to wishlist warning setting");
          } else {
            // Update wishlist setting
            //console.log("Update testing setting");
            tracking[channel].externalbot = extbot;
          }
        }
        if(testingChange){
          if (testing === tracking[channel].testing){
            // Testing setting already set
            testingChange = false;
            //console.log("No change to wishlist warning setting");
          } else {
            // Update wishlist setting
            //console.log("Update testing setting");
            tracking[channel].testing = testing;
          }
        }
      } else {
        // The channel is not yet being tracked - Add the values
        tracking[channel] = {
          "event": event,
          "wishlist": wishlist,
          "externalbot": extbot,
          "testing": testing
        }
      }
      
      let returnMessage;
      if (wlChange || eventChange || extBotChange || testingChange ){
        returnMessage = "The following have been updated: ";
        
        if(wlChange){
          returnMessage += "`wishlist` ";
        }
        if(eventChange){
          returnMessage += "`event` ";
        }
        if(extBotChange){
          returnMessage += "`external bot integrations` ";
        }
        if(testingChange){
          returnMessage += "`testing` ";
        } 
      } else {
        returnMessage = "Tracking has not been changed.";
      }
      
      const jsonString = JSON.stringify(tracking, null, 2); // write to file
      fs.writeFile('./files/track.json', jsonString, err => {
        if (err) return console.log(err);
      });
            
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: returnMessage,
        },
      });
    }


  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});