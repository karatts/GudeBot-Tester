import { EmbedBuilder } from 'discord.js';

const helperBubble = new EmbedBuilder()
  .setColor(0xD3D3D3)
  .setTitle('Help!')
  .setDescription('💞 - Show current Koibito \n🖌️ - Frame and Morph tester \n   Type in the frame name and then the hex color next to it\n   e.g. `Polaroid #0016ff`')

export function cardCodeGenerator(message){
  for (const [key, value] of Object.entries(message.embeds[0])) {
    //console.log(`${key}: ${value}`);
    if(value.title === 'Card Collection'){
      message.react('🔍');
    }
    break;
  }
}

export function cardLookup(message){
  for (const [key, value] of Object.entries(message.embeds[0])) {
    //console.log(`${key}: ${value}`);
    if(value.title === 'Character Lookup'){
      message.react('💞');
      message.react('🖌️');
      message.react('❓');
    }
    if(value.title === 'Character Results'){
      message.reactions.removeAll()
	      .catch(error => console.error('Failed to clear reactions:', error));
    }
    break;
  }
  
  const emoteFilter = (reaction, user) => {
    return ['❓'].includes(reaction.emoji.name) && user.id !== '1092436927996760185';
  };

  message.awaitReactions({ filter: emoteFilter, max: 1, time: 5000, errors: ['time']})
    .then(collected => {
      const reaction = collected.first();
      
      if(reaction.emoji.name === '❓') {
        message.channel.send({embeds: [helperBubble]});
      }
    })
    .catch(collected => {
      console.log('Help me again!');
  });
}