import { Client } from 'discord.js'
import { writeFileSync, unlinkSync } from 'fs'
import { JSDOM } from 'jsdom'
import svg2png from 'svg2png'
import SVGO from 'svgo'
import { URL } from 'url'
import init from './init'

const client = new Client()
init(client)
let leaferJson: { [userId: string]: string } = {}

client.on('message', async msg => {
  // Important variables
  const userMsg = [...msg.content.split(' ')].map(d => {
    return d.toLocaleLowerCase()
  })
  const userCommand = userMsg[1]
  const userCommandOptions = userMsg.splice(2)

  // Command-line functions
  const fetchUserIcon = async (userId: string) => {
    const targetUrl = `https://github.com/${leaferJson[userId]}`
    JSDOM.fromURL(targetUrl)
      .then(
        dom =>
          dom.window.document.body.getElementsByClassName(
            'js-calendar-graph-svg'
          )[0]
      )
      .then(elemSvg => elemSvg.outerHTML)
      .then(svg => new SVGO().optimize(svg))
      .then(optimizedSvg => Buffer.from(optimizedSvg.data))
      .then(buffer =>
        svg2png(buffer).then(png => writeFileSync(`./tmp/${userId}.png`, png))
      )
  }
  const setUser = (userId: string, userName: string) => {
    try {
      leaferJson = Object.assign(leaferJson, {
        [userId]: userName,
      })
      fetchUserIcon(userId)
      msg.channel.send('登録が完了しました')
    } catch (e) {
      msg.channel.send('エラーが発生しました、最初からやり直してください')
    }
  }
  const removeUser = (userId: string) => {
    try {
      delete leaferJson[userId]
      writeFileSync('./tmp/leafer.json', JSON.stringify(leaferJson), 'utf-8')
      unlinkSync(`./tmp/${userId}.png`)
      msg.channel.send(`ユーザーの削除が完了しました`)
    } catch (e) {
      msg.channel.send('エラーが発生しました、最初からやり直してください')
    }
  }
  const getOptionValue = () => userCommandOptions.join(' ').toLocaleLowerCase()

  if (!msg.author.bot) {
    switch (userMsg[0]) {
      case '!leaf':
        switch (userCommand) {
          case 'set':
            if (userCommandOptions.length !== 0) {
              try {
                const parsedUrl = new URL(getOptionValue())
                switch (parsedUrl.host.replace('.com', '')) {
                  case 'github':
                    setUser(
                      msg.author.id,
                      parsedUrl.pathname
                        .replace(/^\/+|\/+$/g, '')
                        .split('/')
                        .pop() as string
                    )
                    break
                  default:
                    throw new Error()
                }
              } catch {
                msg.channel.send(
                  'エラーが発生しました、最初からやり直してください'
                )
              }
            } else {
              msg.channel.send('ユーザー名を入力してください')
              msg.channel
                .awaitMessages(() => !msg.author.bot, {
                  max: 1,
                  time: 30000,
                })
                .then(collectedUserName => {
                  setUser(
                    msg.author.id,
                    collectedUserName.first()!.content.toLocaleLowerCase()
                  )
                })
                .catch(() => {
                  msg.channel.send(
                    'エラーが発生しました、最初からやり直してください'
                  )
                })
            }
            break
          case 'remove':
            removeUser(msg.author.id)
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
                  'GitHubにのみ対応しています\n`!leaf <コマンド>`のように入力してください\n各コマンドについては以下の通りです',
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
                      '`!leaf set <GitHubのURL>`で、URLから直接登録できます',
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
        break
      case '草':
      case 'grass':
        msg.channel.send('', { files: [`./tmp/${msg.author.id}.png`] })
        break
      default:
        break
    }
  }
})

client.login(process.env.LEAFER_TOKEN)
