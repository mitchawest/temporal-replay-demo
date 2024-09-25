import express, { Request, Response } from 'express';
import temporalClient from '../utils/temporal-client';
import redisUtil from '../utils/redis-util';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { addCodeGenJob, setExecutionState } from '../workers/workflows';
import { ScheduleHandle, ScheduleNotFoundError } from '@temporalio/client';

const app = express();
const port = 8005;

const run = async () => {
  app.use(express.json());
  app.use(cors())

  app.post('/codes', async (req: Request, res: Response) => {
    const {count} = req.query
    const batchId = uuid()
    await temporalClient.startWorkflow('createPromotionCodes', {id: batchId, count: Number(count)})
    res.status(201).send({batchId})
  });

  app.post('/codes-parent', async (req: Request, res: Response) => {
    const {count} = req.query
    const batchId = uuid()
    await temporalClient.client
      ?.workflow.signalWithStart('createPromotionCodesParent', {
        workflowId: 'ParentPromotionCodeWorkflow',
        taskQueue: 'default',
        args: [],
        signal: addCodeGenJob,
        signalArgs: [{ id: batchId, count: Number(count) }],
      })
    res.status(201).send({batchId})
  });

  app.post('/codes-scheduled', async (req: Request, res: Response) => {
    const {count} = req.query
    const batchId = uuid()
    await temporalClient.client
      ?.workflow.signalWithStart('createPendingPromotionCodes', {
        workflowId: 'PendingPromotionCodeWorkflow',
        taskQueue: 'default',
        args: [],
        signal: addCodeGenJob,
        signalArgs: [{ id: batchId, count: Number(count) }],
      })
    res.status(201).send({batchId})
  });

  app.post('/pause-schedule', async (req: Request, res: Response) => {
    const scheduleHandle = temporalClient.client
      ?.schedule.getHandle('PendingPromotionCodeSchedule')
    const scheduleInfo = await scheduleHandle?.describe()
    const currentRun = scheduleInfo?.info.runningActions[0]
    if (currentRun) {
      const runningWorkflowHandle = temporalClient.client
        ?.workflow.getHandle(currentRun.workflow.workflowId)
      await runningWorkflowHandle
        ?.signal(setExecutionState, { shouldExecute: false })
    }
    await scheduleHandle?.pause()
    res.status(200).send()
  });

  app.post('/unpause-schedule', async (req: Request, res: Response) => {
    const scheduleHandle = temporalClient.client
      ?.schedule.getHandle('PendingPromotionCodeSchedule')
    const scheduleInfo = await scheduleHandle?.describe()
    const currentRun = scheduleInfo?.info.runningActions[0]
    if (currentRun) {
      const runningWorkflowHandle = temporalClient.client
        ?.workflow.getHandle(currentRun.workflow.workflowId)
      await runningWorkflowHandle
        ?.signal(setExecutionState, { shouldExecute: true })
    }
    await scheduleHandle?.unpause()
    res.status(200).send()
  });

  app.get('/codes', async (req: Request, res: Response) => {
    const {batchId, start, end} = req.query
    const codes: string[] = await redisUtil.getCachedValue(String(batchId))
    const totalCount = codes?.length || 0
    const response = {
      batchId,
      codes: codes?.slice(Number(start) - 1, Number(end)),
      totalCount
    }
    res.status(200).send(response)
  })

  redisUtil.init()
  await temporalClient.initialize()
  const scheduleHandle = temporalClient.client?.schedule.getHandle('PendingPromotionCodeSchedule')
  try {
    await scheduleHandle?.describe()
  } catch (err) {
    if (err instanceof ScheduleNotFoundError) {
      await temporalClient.client?.schedule.create({
        scheduleId: 'PendingPromotionCodeSchedule',
        spec: {
          intervals: [{every: 1000 * 15}]
        },
        action: {
          type: 'startWorkflow',
          workflowType: 'scheduledCreatePromotionCodes',
          taskQueue: 'default'
        }
      }) as ScheduleHandle
    }
  }
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

run()
  .catch((e: Error) => console.error(e))

