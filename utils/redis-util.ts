import Redis, { RedisOptions } from 'ioredis'

class RedisUtil {
  private redis?: Redis
  private options: RedisOptions
  private url: string
  disconnect = () => this.redis?.disconnect()
  cacheValue = async (key: string, value: object) => {
    await this.redis
      ?.pipeline()
      .set(key, JSON.stringify(value))
      .exec()
      .then(
        () => {
          console.log(`successfully cached ${key} in redis`)
        }
      )
      .catch(
        (e: Error) => {
          console.error(`redis error caching: ${key} in redis. error: ${e}`)
        }
      )
  }
  getCachedValue = async (key: string): Promise<any | undefined> => {
    const value = await this.redis?.get(key)
    if (value) {
      return JSON.parse(value)
    }
  }
  init = () => {
    this.redis = new Redis(this.url, this.options)
    this.redis.on('error', (e) => {
      console.error(e)
    })
  }
  constructor(args: any) {
    const {
      timeout: connectTimeout,
      username,
      password,
      url
    } = args

    if (!url) {
      throw new Error('invalid argument: missing url')
    }
    this.url = url
    this.options = {
      connectTimeout,
      username,
      password,
      tls: url.startsWith('rediss://')
        ? { checkServerIdentity: () => undefined }
        : undefined
    }
  }
}

const redisUtil = new RedisUtil({
  timeout: 10000,
  url: 'redis:6379'
})

export default redisUtil
