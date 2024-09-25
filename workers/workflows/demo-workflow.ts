import {
  ChildWorkflowHandle,
  defineSignal,
  defineUpdate,
  executeChild,
  proxyActivities,
  setHandler,
  sleep,
  startChild,
  uuid4,
  workflowInfo
} from '@temporalio/workflow'
import { ActivityOptions, Workflow } from '@temporalio/common'

import type * as activities from '../activities'

export const createPromotionCodes = async ({
  id,
  count
}: {id: string, count: number}): Promise<string> => {
  let promoCodesRemaining = count
  const batchSize = 500
  let allCodes: string[] = []
  do {
    const batch: string[] = []
    for (let i = 0; i < Math.min(promoCodesRemaining, batchSize); i++) {
      batch.push(uuid4())
    }
    await writeCodes(id, batch)
    allCodes = [...allCodes, ...batch]
    promoCodesRemaining -= batchSize
  } while (promoCodesRemaining > 0)
  await writeToS3(allCodes)
  await sendKafkaEvent({
    status: 'SUCCESS',
    batchId: id
  })
  return id
}

export const addCodeGenJob = defineSignal<[{id: string, count: number}]>('addCodeGenJob')
export const createPromotionCodesParent = async (): Promise<void> => {
  const jobs: {id: string, count: number}[] = []
  setHandler(addCodeGenJob, (job) => {
    jobs.push(job)
  })
  do {
    const job = jobs.shift()
    await executeChild('createPromotionCodes', {
      args: [job],
      taskQueue: 'default',
      workflowId: job?.id
    })
  } while (jobs.length)
  return
}

export const getPendingPromotionJob = defineUpdate<{id: string, count: number} | undefined, []>('getPendingPromotionJob')
export const createPendingPromotionCodes = async (job?: {id: string, count: number}): Promise<void> => {
  const jobs = [job]
  setHandler(addCodeGenJob, (job) => {
    jobs.push(job)
  })
  setHandler(getPendingPromotionJob, () => {
    const job = jobs.shift()
    return job
  })
  do {
    await sleep(1000 * 60 * 1)
  } while (jobs.length)
  return
}

export const scheduledCreatePromotionCodes = async (): Promise<void> => {
  do {
    const job = await getJobFromPendingWorkflow()
    if (!job) {
      break;
    }
    await executeChild('createPromotionCodes', {
      args: [job],
      taskQueue: 'default',
      workflowId: job.id
    })
  } while (1 === 1)
  return
}

export const scheduledCreatePromotionCodesPausable = async (): Promise<void> => {
  let currentChildHandle: ChildWorkflowHandle<Workflow>
  setHandler(setExecutionState, (exectutionState) => {
    if (currentChildHandle) {
      currentChildHandle.signal(setExecutionState, exectutionState)
    }
  })
  do {
    const job = await getJobFromPendingWorkflow()
    if (!job) {
      break;
    }
    currentChildHandle = await startChild('createPromotionCodesPausable', {
      args: [job],
      taskQueue: 'default',
      workflowId: job.id
    })
    await currentChildHandle.result()
  } while (1 === 1)
  return
}


export const setExecutionState = defineSignal<[{shouldExecute: boolean}]>('setExecutionState')
export const createPromotionCodesPausable = async ({
  id,
  count
}: {id: string, count: number}): Promise<string> => {
  let shouldExecute: boolean = true
  setHandler(setExecutionState, ({ shouldExecute: signalledShouldExecute }) => {
    shouldExecute = signalledShouldExecute
  })
  let promoCodesRemaining = count
  const batchSize = 500
  let allCodes: string[] = []
  do {
    if (shouldExecute) {
      const batch: string[] = []
      for (let i = 0; i < Math.min(promoCodesRemaining, batchSize); i++) {
        batch.push(uuid4())
      }
      await writeCodes(id, batch)
      allCodes = [...allCodes, ...batch]
      promoCodesRemaining -= batchSize
    }
    else {
      await sleep(15000)
    }
  } while (promoCodesRemaining > 0)
  await writeToS3(allCodes)
  await sendKafkaEvent({
    status: 'SUCCESS',
    batchId: id
  })
  return id
}


const activityOptions: ActivityOptions = {
  startToCloseTimeout: '30s',
  retry: {
    initialInterval: '10s',
    backoffCoefficient: 1,
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['non_retryable']
  }
}
const { writeCodes, writeToS3, sendKafkaEvent, getJobFromPendingWorkflow } =
  proxyActivities<typeof activities>(activityOptions)