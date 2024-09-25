/** Typescript and module imports */
import { ApplicationFailure, log } from '@temporalio/activity'
import redisUtil from '../../utils/redis-util'
import temporalClient from '../../utils/temporal-client'
import { getPendingPromotionJob } from '../workflows'

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(() => resolve(1), ms)
})

export const writeCodes = async (batchId: string, codes: string[]) => {
  try {
    const existingCodes = await redisUtil.getCachedValue(batchId) || []
    const newCodes = [...existingCodes, ...codes]
    await redisUtil.cacheValue(batchId, newCodes)
    await sleep(500)
  }
  catch (e) {
    const err = e as Error
    log.error(err.message)
    throw new ApplicationFailure(err.message, 'retryable', false)
  }
}

export const writeToS3 = async (codes: string[]) => {
  await sleep(5000)
}

export const sendKafkaEvent = async (eventDetail: {status: string, batchId: string}) => {
  await sleep(1000)
}

export const getJobFromPendingWorkflow = async () => {
  await temporalClient.initialize()
  const handle = temporalClient.client?.workflow.getHandle('PendingPromotionCodeWorkflow')
  try {
    const job = await handle?.executeUpdate(getPendingPromotionJob)
    return job
  } catch (err: any) {
    log.info(err.message)
  }  
}
  