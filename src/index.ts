import { existsSync, mkdir, readFileSync, writeFileSync } from 'fs'
import { Client, User } from 'discord.js'
import puppeteer from 'puppeteer'
import sharp from 'sharp'
import SVGO from 'svgo'
import { URL } from 'url'

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
  console.log(`Leafer is running now.`)
})

client.on('message', async msg => {
  // Important variables
  const userMsg = [...msg.content.split(' ')].map(d => {
    return d.toLocaleLowerCase()
  })
  const userCommand = userMsg[1]
  const userCommandOptions = userMsg.splice(2)

  // Command-line functions
  const fetchUserIcon = (userId: string) => {
    let targetSelector: string
    switch (leaferJson[userId].platform) {
      case 'github':
        targetSelector = '.js-calendar-graph-svg'
        break
      case 'gitlab':
        targetSelector = '.contrib-calendar'
        break
      default:
        return
    }
    ;(async () => {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const page = await browser.newPage()
      await page.goto(
        `https://${leaferJson[userId].platform}.com/${leaferJson[userId].name}`
      )
      const data = await page.waitForSelector(targetSelector).then(() =>
        page.$eval(targetSelector, item => {
          return item.outerHTML
        })
      )
      const svgo = new SVGO()
      svgo
        .optimize(data)
        .then(result => Buffer.from(result.data))
        .then(svgBuffer =>
          sharp(svgBuffer)
            .resize(1000, null)
            .png()
            .toFile(`./tmp/${userId}.png`)
        )
      await browser.close()
    })()
  }
  const setUser = (userId: string, userName: string, userPlatform: string) => {
    try {
      writeFileSync(
        './tmp/leafer.json',
        JSON.stringify(
          Object.assign(leaferJson, {
            [userId]: { name: userName, platform: userPlatform },
          })
        ),
        'utf-8'
      )
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
      msg.channel.send(`ユーザーの削除が完了しました`)
    } catch (e) {
      msg.channel.send('エラーが発生しました、最初からやり直してください')
    }
  }
  const getOptionValue = () => userCommandOptions.join(' ').toLocaleLowerCase()

  // Message filters
  interface IMsgFilter {
    author: User
    content: string
  }

  const platformFilter = (m: IMsgFilter) =>
    ['github', 'gitlab'].includes(m.content.toLocaleLowerCase()) &&
    !m.author.bot
  const usernameFilter = (m: IMsgFilter) => !m.author.bot

  if (!msg.author.bot) {
    if (userMsg[0] === '!leaf') {
      switch (userCommand) {
        case 'set':
          if (userCommandOptions.length !== 0) {
            try {
              const parsedUrl = new URL(getOptionValue())
              setUser(
                msg.author.id,
                parsedUrl.pathname
                  .replace(/^\/+|\/+$/g, '')
                  .split('/')
                  .pop() as string,
                parsedUrl.host.replace('.com', '')
              )
            } catch {
              msg.channel.send(
                'エラーが発生しました、最初からやり直してください'
              )
            }
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
                      msg.author.id,
                      collectedUserName.first()!.content.toLocaleLowerCase(),
                      `${collectedPlatform
                        .first()!
                        .content.toLocaleLowerCase()}`
                    )
                  })
                  .catch(() => {
                    msg.channel.send(
                      'エラーが発生しました、最初からやり直してください'
                    )
                  })
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
                'GitHubとGitLabにのみ対応しています\n`!leafer <コマンド>`のように入力してください\n各コマンドについては以下の通りです',
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
                    '`!leafer set <GitHub|GitLabのURL>`で、URLから直接登録できます',
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
      msg.channel.send('', { files: [`./tmp/${msg.author.id}.png`] })
    }
  }
})

client.login(process.env.LEAFER_TOKEN)
