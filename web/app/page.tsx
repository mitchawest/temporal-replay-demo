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
      <main className={styles.main} style={{
        width: '75vw',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '5px',
        padding: '20px',
        color: 'black',
        fontSize: '30px',
        fontWeight: '600',
        boxShadow: '1px 1px 15px lightslategrey'
      }}>
      <h1 style={{color: '#383838', fontSize: '70px', fontWeight: 200}}>Promo Generator</h1>
        <div className={styles.ctas} style={{flexDirection: 'column', justifyContent: 'space-between', width: '85%', alignItems: 'start'}}>
          <div className={styles.ctas} style={{flexDirection: 'column', height: '100px', justifyContent: 'end'}}>
            <label htmlFor="code-count">Count</label>
            <input
              id="code-count"
              className={styles.primary}
              type="number"
              placeholder="10000"
              style={{height: '50px', fontSize: '30px'}}
              value={count}
              onChange={({nativeEvent}) => {
                const event: any = nativeEvent
                setCount(Number(event.target.value))
              }}
            >
            </input>
          </div>
          <div style={{display: 'flex', flexDirection: 'row'}}>
            <a
              className={styles.primary}
              style={{width: '225px', fontSize: '30px', marginRight: '10px'}}
              onClick={() => createBatch()}
            >
              Create
            </a>
            <a
              className={styles.primary}
              style={{width: '225px', fontSize: '30px', marginRight: '10px'}}
              onClick={() => createSafeBatch()}
            >
              Safe Create
            </a>
            <a
              className={styles.primary}
              style={{width: '225px', fontSize: '30px', marginRight: '10px'}}
              onClick={() => createScheduled()}
            >
              Schedule
            </a>
            <a
              className={styles.primary}
              style={{width: '225px', fontSize: '30px', marginRight: '10px'}}
              onClick={() => setSchedulePausedState()}
            >
              {`${pausedState.text}`}
            </a>
          </div>
        </div>
        <div className={styles.ctas} style={{flexDirection: 'column', justifyContent: 'space-between', width: '85%', alignItems: 'start'}}>
          <div className={styles.ctas} style={{flexDirection: 'column', width: '100%', justifyContent: 'end'}}>
            <label htmlFor="batch-id">Batch ID</label>
            <input
              id="batch-id"
              className={styles.primary}
              type="text"
              placeholder='b40c8740-7737-42d3-800b-c427bca1dc8a' 
              style={{height: '50px', width: '100%', fontSize: '30px'}}
              value={batchId}
              onChange={({nativeEvent}) => {
                const event: any = nativeEvent
                setBatchId(String(event.target.value))
              }}
            >
            </input>
          </div>
          <a
            className={styles.primary}
            style={{width: '300px', fontSize: '30px'}}
            onClick={() => {
                setRange([1, 5])
                fetchCodes([1, 5])
              }
            }
          >
            Search
          </a>
        </div>
      <div style={{display:'flex', flexDirection: 'column', alignItems: 'center', width: '85%'}}>
        <div style={{display: 'flex', width: '50%', justifyContent: 'space-between'}}>
          <label>Records: {range[0]} - {range[1]}</label>
          <label>{`Total: ${dataTotal}`}</label>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', width: '75px', justifyContent: 'space-between', fontSize: '24px', fontWeight: '500', marginBottom: '5px'}}>
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
          <div className="p-2" style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <table style={{width: '100%', backgroundColor: '#383838', color: 'white', borderRadius: '5px', minHeight: '10vh', border: '2px solid rgb(118, 118, 118)'}}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} style={{ borderBottom: '1px solid white', padding: '5px', textAlign: 'center', width: '50%'}}>
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
                  <tr key={row.id} style={{textAlign: 'center'}}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: '5px', fontSize: '20px'}}>
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
