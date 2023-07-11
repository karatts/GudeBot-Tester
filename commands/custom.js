import { removeSpecificReactions } from './../custom_utility.js';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

//const react = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

const copyIDs = new EmbedBuilder()
  .setColor(0xeed202)
  .setTitle('Copy Card IDs')
  .setDescription('IDs you\'ve copied:')

const copyStart = new EmbedBuilder()
  .setColor(0xeed202)
  .setTitle('Copy Helper')
  .setDescription(' 🔢 - Load reacts to copy card IDs or add the # react. Adding the same react twice will remove it from the list.\n 📖 - Display copied IDs\n 🗑 - Clear list')

// const idclear = new ButtonBuilder()
//   .setCustomId('idclear')
// 	.setLabel('Clear List')
// 	.setStyle(ButtonStyle.Danger);

// const cancel = new ButtonBuilder()
// 			.setCustomId('cancel')
// 			.setLabel('Cancel')
// 			.setStyle(ButtonStyle.Secondary);

// const row = new ActionRowBuilder()
// 			.addComponents(cancel, idclear);

// export async function triggerCopyEmbed(interaction){
//   await interaction.reply({
// 		embed: [copyIDs],
// 		components: [row],
// 	});
// }

export function displayCopyEmbed(message){
  message.channel.send({embed: [copyStart]}).then(embedMessage => {
    embedMessage.react('🔢');
    embedMessage.react('📖');
    embedMessage.react('🗑');
  });
}

export function copypasta(message){
  for (const [key, value] of Object.entries(message.embeds[0])) {
    if(value.title === 'Card Collection'){
      message.react('📋');

      const emoteFilter2 = (reaction, user) => {
        return ['📋'].includes(reaction.emoji.name) && user.id !== process.env.APP_ID;
      };
      // const idFilter = (reaction, user) => {
      //   return react.includes(reaction.emoji.name) && user.id !== process.env.APP_ID;
      // };

      message.awaitReactions({ filter: emoteFilter2, max: 1, time: 5000, errors: ['time']})
        .then(collected => {
          const reaction = collected.first();
      
          if(reaction.emoji.name === '📋') {
            // message.send('')
            // message.react('🔢');
            // let ids = getIDs(value);
            // for(let id in ids){
            //   message.react(react[id]);
            // }
            // message.react('📝');
            // message.send('📖');
            // message.react('🗑');
            removeSpecificReactions(message, ['📋']);
          }
        })
        .catch(collected => {
            removeSpecificReactions(message, ['📋']);
        });

      break;
      }
  }
}

function getIDs(value){
  let tester = value.description;
  const regex = /(\*\*`(.+)`\*\*)/;
  tester = tester.split(regex);
  let ids = tester.filter(element => element.match(regex));
  ids = ids.map(id => id.replace(/[\*`]/g, ''));
  return ids;
}