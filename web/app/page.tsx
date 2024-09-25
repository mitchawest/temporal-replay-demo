'use client';
import { useState } from "react";
import styles from "./page.module.css";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import clsx from 'clsx';

type Code = {
  batchId: string;
  code: string;
}

const defaultTableData: Code[] = [{
  batchId: '',
  code: ''
}]

const columnHelper = createColumnHelper<Code>()

const columns = [
  columnHelper.accessor('batchId', {
    header: () => 'Batch ID',
    cell: info => info.getValue(),
    footer: info => info.column.id,
  }),
  columnHelper.accessor('code', {
    header: () => 'Code',
    cell: info => info.renderValue(),
    footer: info => info.column.id,
  })
]

export default function Home() {
  const [batchId, setBatchId] = useState(undefined as string)
  const [count, setCount] = useState(undefined as number)
  const [range, setRange] = useState([1, 5])
  const [data, setData] = useState(defaultTableData)
  const [dataTotal, setDataTotal] = useState(0)
  const [pausedState, setPausedState] = useState({ state: 'UNPAUSED', text: 'Pause' }) 

  const fetchCodes = (newRange?: number[]) => {
    const useRange = newRange || range
    axios.get(`http://localhost:8005/codes?batchId=${batchId}&start=${useRange[0]}&end=${useRange[1]}`)
    .then(function (response) {
      setDataTotal(response.data?.totalCount || 0)
      setData(response.data?.codes?.map((code) => ({batchId, code})) || defaultTableData)
    })
    .catch(function (error) {
      toast.error(error?.message)
      console.log(error);
    })
  }

  const createBatch = () => {
    axios.post(`http://localhost:8005/codes?count=${count}`)
    .then(function (response) {
      toast.success('Workflow Created: ' + response?.data?.batchId)
    })
    .catch(function (error) {
      toast.error(error?.message)
      console.log(error);
    })
  }

  const createSafeBatch = () => {
    axios.post(`http://localhost:8005/codes-parent?count=${count}`)
    .then(function (response) {
      toast.success('Job Pushed to Worfkflow: ' + response?.data?.batchId)
    })
    .catch(function (error) {
      toast.error(error?.message)
      console.log(error);
    })
  }

  const createScheduled = () => {
    axios.post(`http://localhost:8005/codes-scheduled?count=${count}`)
    .then(function (response) {
      toast.success('Job Accepted: ' + response?.data?.batchId)
    })
    .catch(function (error) {
      toast.error(error?.message)
      console.log(error);
    })
  }

  const setSchedulePausedState = () => {
    if (pausedState.state !== 'PAUSED') {
      axios.post(`http://localhost:8005/pause-schedule`)
        .then(function (response) {
          toast.success('Schedule paused')
          setPausedState({ state: 'PAUSED', text: 'Resume'})
        })
        .catch(function (error) {
          toast.error(error?.message)
          console.log(error);
        })
    }
    else {
      axios.post(`http://localhost:8005/unpause-schedule`)
        .then(function (response) {
          toast.success('Schedule resumed')
          setPausedState({ state: 'UNPAUSED', text: 'Pause'})
        })
        .catch(function (error) {
          toast.error(error?.message)
          console.log(error);
        })
    }
  }


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })


  return (
    <div className={styles.page} style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '10px'
    }}>
      <main className={styles.main}>
      <h1 className={styles.header}>Promo Generator</h1>
        <div className={clsx(styles.ctas, styles.section)}>
          <div className={clsx(styles.ctas, styles.column)}>
            <label htmlFor="code-count">Count</label>
            <input
              id="code-count"
              className={clsx(styles.primary, styles.input)}
              type="number"
              placeholder="10000"
              value={count}
              onChange={({nativeEvent}) => {
                const event: any = nativeEvent
                setCount(Number(event.target.value))
              }}
            >
            </input>
          </div>
          <div className={styles.buttonContainer}>
            <a
              className={clsx(styles.primary,styles.button)}
              onClick={() => createBatch()}
            >
              Create
            </a>
            <a
              className={clsx(styles.primary,styles.button)}
              onClick={() => createSafeBatch()}
            >
              Safe Create
            </a>
            <a
              className={clsx(styles.primary,styles.button)}
              onClick={() => createScheduled()}
            >
              Schedule
            </a>
            <a
              className={clsx(styles.primary,styles.button)}
              onClick={() => setSchedulePausedState()}
            >
              {`${pausedState.text}`}
            </a>
          </div>
        </div>
        <div className={clsx(styles.ctas, styles.section)}>
          <div className={clsx(styles.ctas, styles.column)}>
            <label htmlFor="batch-id">Batch ID</label>
            <input
              id="batch-id"
              className={clsx(styles.primary, styles.input)}
              type="text"
              placeholder='b40c8740-7737-42d3-800b-c427bca1dc8a' 
              value={batchId}
              onChange={({nativeEvent}) => {
                const event: any = nativeEvent
                setBatchId(String(event.target.value))
              }}
            >
            </input>
          </div>
          <a
            className={clsx(styles.primary, styles.button)}
            onClick={() => {
                setRange([1, 5])
                fetchCodes([1, 5])
              }
            }
          >
            Search
          </a>
        </div>
      <div className={styles.sectionCentered}>
        <div className={styles.tableMeta}>
          <label>Records: {range[0]} - {range[1]}</label>
          <label>{`Total: ${dataTotal}`}</label>
        </div>
        <div className={styles.tableNav}>
          <a 
            style={{cursor: 'pointer'}} 
            onClick={() => {
              const newRange = [Math.max(range[0] - 5, 1), Math.max(range[1] - 5, 5)]
              setRange(newRange)
              fetchCodes(newRange)
            }}>{'<'}</a>
          <a
            style={{cursor: 'pointer'}} 
            onClick={() => {
              const newRange = [range[0] + 5, range[1] + 5]
              setRange(newRange)
              fetchCodes(newRange)
            }}>{'>'}</a>
        </div>
        {data?.length ? 
          <div className={styles.sectionCentered}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className={styles.tableHeader}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={styles.tableContent}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={styles.tableContent}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        : null}
      </div>
      </main>
    </div>
  );
}
