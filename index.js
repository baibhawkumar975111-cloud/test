const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = "MTQ3NjgwNzY1MzE0NDY1Nzk2Mw.G5mg-X.12nlrir6z7Qg-DIgMp1CsSss7PN9WI9fDeKa5E";
const CLIENT_ID = "1476807653144657963";
const GUILD_ID = "1452987784880197704";
const STAFF_ROLE_ID = "1452987785324658803"; // Staff role ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Create LunarCraft Ticket Panel"),

  new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close this ticket"),

  new SlashCommandBuilder()
    .setName("assign")
    .setDescription("Assign this ticket")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Select staff member")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim this ticket"),

  new SlashCommandBuilder()
    .setName("unclaim")
    .setDescription("Unclaim this ticket")
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash commands registered.");
})();

client.on("interactionCreate", async interaction => {

  // PANEL COMMAND
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "panel") {

      const embed = new EmbedBuilder()
        .setTitle("🌙 LunarCraft Support Panel")
        .setDescription("Click below to create a support ticket.\nOur staff will assist you shortly.")
        .setColor("#6a0dad");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("🎫 Create Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // CLOSE COMMAND
    if (interaction.commandName === "close") {

      if (!interaction.channel.name.startsWith("ticket-"))
        return interaction.reply({ content: "This is not a ticket channel.", ephemeral: true });

      await interaction.reply("Closing ticket in 5 seconds...");
      setTimeout(() => {
        interaction.channel.delete();
      }, 5000);
    }

    // ASSIGN COMMAND
    if (interaction.commandName === "assign") {

      const user = interaction.options.getUser("user");

      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true
      });

      await interaction.reply(`✅ Ticket assigned to ${user}`);
    }

    // CLAIM COMMAND
    if (interaction.commandName === "claim") {

      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID))
        return interaction.reply({ content: "Only staff can claim tickets.", ephemeral: true });

      await interaction.channel.setTopic(`Claimed by ${interaction.user.tag}`);
      await interaction.reply(`🎟️ Ticket claimed by ${interaction.user}`);
    }

    // UNCLAIM COMMAND
    if (interaction.commandName === "unclaim") {

      await interaction.channel.setTopic(null);
      await interaction.reply("❌ Ticket unclaimed.");
    }
  }

  // BUTTON CREATE TICKET
  if (interaction.isButton()) {

    if (interaction.customId === "create_ticket") {

      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username}`
      );

      if (existing)
        return interaction.reply({ content: "You already have a ticket!", ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: STAFF_ROLE_ID,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Created")
        .setDescription("Support will be with you shortly.\nUse `/close` when solved.")
        .setColor("Green");

      await channel.send({
        content: `<@&${STAFF_ROLE_ID}>`,
        embeds: [embed]
      });

      await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    }
  }
});

client.login(TOKEN);