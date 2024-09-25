import {
  Worker,
  NativeConnection,
  Runtime,
  DefaultLogger,
  WorkerOptions
} from '@temporalio/worker'
import redisUtil from '../utils/redis-util'
import * as activities from './activities'

async function run() {
  redisUtil.init()

  Runtime.install({
    logger: new DefaultLogger('INFO', ({ message, meta }) => {
      console.log(`${message} ${meta ? JSON.stringify(meta) : ''}`)
    })
  })

  let nativeConnection: any
  do {
    try {
      nativeConnection = await NativeConnection.connect({
        address: 'temporal:7233'
      })
    }
    catch (err: any) {}
  } while (!nativeConnection)

  

  const workerOptions: WorkerOptions = {
    connection: nativeConnection,
    activities, 
    taskQueue: 'default',
    namespace: 'default'
  }

  workerOptions.workflowsPath = require.resolve(
    `${__dirname}/workflows/index.ts`
  )

  const worker = await Worker.create(workerOptions)

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
