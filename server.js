const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Replace 'YOUR_TELEGRAM_BOT_API_TOKEN' with the token you got from BotFather
const bot = new Telegraf('7322827112:AAG57gdX240zTwt3VYNHCK1Oj_Xiu-dr2wA');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/passwords')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

const passwordSchema = new mongoose.Schema({
  userId: String,
  website: String,
  password: String
});

const Password = mongoose.model('Password', passwordSchema);

bot.start((ctx) => ctx.reply('Welcome! Use /save to save a password, /get to retrieve your passwords, /delete to delete a password, and /search to search for a password.'));

bot.command('save', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return ctx.reply('Usage: /save website password');
  }
  const website = args[1];
  const password = args[2];
  const userId = ctx.message.from.id;

  const newPassword = new Password({ userId, website, password });
  newPassword.save()
    .then(() => ctx.reply('Password saved!'))
    .catch(err => ctx.reply('Error saving password.'));
});

bot.command('get', (ctx) => {
  const userId = ctx.message.from.id;

  Password.find({ userId }).then(passwords => {
    if (passwords.length === 0) {
      return ctx.reply('No passwords found.');
    }
    let response = 'Your passwords:\n';
    passwords.forEach(p => {
      response += `${p.website}: ${p.password}\n`;
    });
    ctx.reply(response);
  }).catch(err => ctx.reply('Error retrieving passwords.'));
});

bot.command('delete', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Usage: /delete website');
  }
  const website = args[1];
  const userId = ctx.message.from.id;

  Password.deleteOne({ userId, website })
    .then(result => {
      if (result.deletedCount === 0) {
        return ctx.reply('No password found for the specified website.');
      }
      ctx.reply('Password deleted successfully.');
    })
    .catch(err => ctx.reply('Error deleting password.'));
});

bot.command('search', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Usage: /search website');
  }
  const website = args[1];
  const userId = ctx.message.from.id;

  Password.find({ userId, website }).then(passwords => {
    if (passwords.length === 0) {
      return ctx.reply('No passwords found for the specified website.');
    }
    let response = `Passwords for ${website}:\n`;
    passwords.forEach(p => {
      response += `${p.website}: ${p.password}\n`;
    });
    ctx.reply(response);
  }).catch(err => ctx.reply('Error retrieving passwords.'));
});

bot.launch();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
