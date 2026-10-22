import { dispatch, type Req, type Res } from './dispatch'
import { pgStore } from './store.pg'

/** Jalankan satu permintaan API di dalam proses (dipakai server components & route handler). */
export const handle = (req: Req): Promise<Res> => dispatch(pgStore, req)
