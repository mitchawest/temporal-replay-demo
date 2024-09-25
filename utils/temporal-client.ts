import {
  Client,
  Connection,
  ConnectionOptions,
  WorkflowHandle
} from '@temporalio/client'

export interface TemporalClient {
  client?: Client
  initialize: () => Promise<void>
  startWorkflow: (
    workflowName: string,
    args: {id: string, count: number}
  ) => Promise<{workflowId: string, handle: WorkflowHandle}>
  close: () => Promise<void>
}

const temporalClient: TemporalClient = {
  initialize: async () => {
    console.log('Initializing workflow client')

    const connectionOptions: ConnectionOptions = {
      address: 'temporal:7233',
      connectTimeout: 60 * 1000
    }

    temporalClient.client = new Client({
      namespace: 'default',
      connection: await Connection.connect(connectionOptions)
    })
  },
  startWorkflow: async (
    workflowName,
    args
  ) => {
    const workflowId = args.id
    if (!temporalClient.client) {
      throw new Error('Temporal client not initialized')
    }
    console.log('Starting ' + workflowName)
    const handle: WorkflowHandle = await temporalClient.client.workflow
      .start(workflowName, {
        args: [args],
        taskQueue: 'default',
        workflowId
      })
    return { workflowId, handle }
  },
  close: async () => {
    if (temporalClient.client) {
      console.log('Closing Temporal client')
      await temporalClient.client.connection.close()
    }
  }
}

export default temporalClient
