import {Client} from 'discord.js'

const client = new Client()

client.on('ready', () => {
  process.stdout.write(`${client.user!.username}でログインしています`)
})

client.on('message', async msg => {
  const userMsg = msg.content.split(' ')
  if (!msg.author.bot && userMsg[0] === '!leaf') {
    const userCommand = userMsg[1]
    // const userCommandOptions = userMsg.splice(2)
    switch (userCommand) {
      case 'set':
        msg.channel.send(`プラットフォームを入力してください`)
        msg.channel.send(`ユーザー名を入力してください`)
        break
      case 'clear':
        msg.channel.send(`ユーザーの削除が完了しました`)
        break
      case 'help':
      case undefined:
        msg.channel.send({
          embed: {
            author: {
              name: 'tuxsnct',
              url: 'https://tuxsnct.com/',
              icon_url: 'https://github.com/tuxsnct.png',
            },
            title: 'Leaferのコマンド一覧',
            description:
              'GitHubとGitLabにのみ対応しています\n`!leafer <コマンド> <コマンドオプション>`のように入力してください\n各コマンドについては以下の通りです',
            color: '#215732',
            timestamp: new Date(),
            footer: {
              icon_url: client.user!.avatarURL,
              text: 'Leafer (leafer-node)',
            },
            fields: [
              {
                name: ':v: `set`',
                value:
                  'ユーザーを登録する\n' +
                  '`-n <ユーザー名>`でユーザー名を登録できます\n' +
                  '`-p <github|gitlab>`でGitHubかGitLabか選択できます' +
                  '`-u <URL>`でURLから直接登録できます',
              },
              {
                name: ':wave: `clear`',
                value: 'ユーザーを削除する',
              },
              {
                name: ':question: `help`',
                value: 'コマンドリストを呼び出す',
              },
              {
                name: ':eyes: `about`',
                value: 'Leaferのバージョン情報を呼び出す',
              },
            ],
          },
        })
        break
      case 'about':
        msg.channel.send({
          embed: {
            author: {
              name: 'tuxsnct',
              url: 'https://tuxsnct.com/',
              icon_url: 'https://github.com/tuxsnct.png',
            },
            title: 'Leaferについて',
            url: 'https://github.com/tuxsnct/leafer-node',
            description: `leafer-node v${process.env.npm_package_version} (Node.js ${process.version})\nリポジトリ: [GitHub](https://github.com/tuxsnct/leafer-node)`,
            color: '#215732',
            timestamp: new Date(),
            footer: {
              icon_url: client.user!.avatarURL,
              text: 'Leafer (leafer-node)',
            },
          },
        })
        break
      default:
        msg.channel.send(`"${userCommand}"コマンドは存在しません`)
        break
    }
  }
})

client.login(process.env.LEAFER_TOKEN)
