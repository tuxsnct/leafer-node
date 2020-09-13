import { existsSync, mkdir, readFileSync, writeFileSync } from 'fs'
import { URL } from 'url'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { Client, User } from 'discord.js'

const client = new Client()

if (!existsSync('./tmp')) {
  mkdir('./tmp', err => {
    if (err) {
      throw err
    }
  })
}
if (!existsSync('./tmp/leafer.json')) {
  writeFileSync('./tmp/leafer.json', '{}')
}
const leaferJson = JSON.parse(readFileSync('./tmp/leafer.json', 'utf-8'))

client.on('ready', () => {
  process.stdout.write(`Leafer is running now.`)
})

client.on('message', async msg => {
  // Important variables
  const userMsg = msg.content.split(' ')
  const userCommand = userMsg[1]
  const userCommandOptions = userMsg.splice(2)

  // Command-line functions
  // TODO: fetchUserIcon has not been implemented yet.
  const fetchUserIcon = (userId: string) =>
    fetch(
      `https://${leaferJson[userId].platform}/${leaferJson[userId].name}`
    ).then(async response => new JSDOM(await response.text()))
  const setUser = (userName: string, userPlatform: string) => {
    writeFileSync(
      './tmp/leafer.json',
      JSON.stringify(
        Object.assign(leaferJson, {
          [msg.author.id]: { name: userName, platform: userPlatform },
        })
      ),
      'utf-8'
    )
  }
  const removeUser = (userName: string) => {
    return userName
  }
  const checkOption = (option: string) => userCommandOptions.includes(option)
  const getOptionValue = (option: string) =>
    userCommandOptions[
      userCommandOptions!.indexOf(option) + 1
    ].toLocaleLowerCase()

  // Message filters
  interface IMsgFilter {
    author: User
    content: string
  }

  const platformFilter = (m: IMsgFilter) =>
    ['github', 'gitlab'].includes(m.content) && !m.author.bot
  const usernameFilter = (m: IMsgFilter) => !m.author.bot

  if (!msg.author.bot) {
    if (userMsg[0] === '!leaf') {
      switch (userCommand) {
        case 'set':
          if (checkOption('-u') && getOptionValue('-u')) {
            const parsedUrl = new URL(getOptionValue('-u'))
            setUser(
              <string>parsedUrl.pathname
                .replace(/^\/+|\/+$/g, '')
                .split('/')
                .pop(),
              parsedUrl.host
            )
          } else if (checkOption('-n') && getOptionValue('-n')) {
            msg.channel.send('`GitHub`か`GitLab`のどちらかを入力してください')
            msg.channel
              .awaitMessages(platformFilter, {
                max: 1,
                time: 30000,
              })
              .then(collected =>
                setUser(
                  getOptionValue('-n'),
                  `${collected.first()!.content.toLocaleLowerCase()}.com`
                )
              )
              .catch(() => {
                msg.channel.send('最初からやり直してください')
              })
          } else if (checkOption('-p') && getOptionValue('-p')) {
            msg.channel.send('ユーザー名を入力してください')
            msg.channel
              .awaitMessages(usernameFilter, {
                max: 1,
                time: 30000,
              })
              .then(collected =>
                setUser(
                  collected.first()!.content.toLocaleLowerCase(),
                  `${getOptionValue('-p')}.com`
                )
              )
              .catch(() => {
                msg.channel.send('最初からやり直してください')
              })
          } else {
            msg.channel.send('`GitHub`か`GitLab`のどちらかを入力してください')
            msg.channel
              .awaitMessages(platformFilter, {
                max: 1,
                time: 30000,
              })
              .then(collectedPlatform => {
                msg.channel.send('ユーザー名を入力してください')
                msg.channel
                  .awaitMessages(usernameFilter, {
                    max: 1,
                    time: 30000,
                  })
                  .then(collectedUserName => {
                    setUser(
                      collectedUserName.first()!.content.toLocaleLowerCase(),
                      `${collectedPlatform
                        .first()!
                        .content.toLocaleLowerCase()}.com`
                    )
                  })
                  .catch(() => {
                    msg.channel.send('最初からやり直してください')
                  })
              })
              .catch(() => {
                msg.channel.send('最初からやり直してください')
              })
          }
          break
        case 'remove':
          removeUser(msg.author.username)
          msg.channel.send(`ユーザーの削除が完了しました`)
          break
        case 'help':
        case undefined:
          msg.channel.send({
            embed: {
              author: {
                name: 'tuxsnct',
                url: 'https://github.com/tuxsnct/',
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
                  name: ':wave: `remove`',
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
    } else if (['草', 'grass'].includes(msg.content)) {
      msg.channel.send('草')
    }
  }
})

client.login(process.env.LEAFER_TOKEN)
