import {useEffect, useState} from 'react';

import {useReplayContext} from 'sentry/components/replays/replayContext';
import type {TraceFullDetailed} from 'sentry/utils/performance/quickTrace/types';
import type {ReplayFrame} from 'sentry/utils/replays/types';
import {
  useFetchTransactions,
  useTransactionData,
} from 'sentry/views/replays/detail/trace/replayTransactionContext';

export interface ReplayTraceRow {
  durationMs: number;
  offsetMs: number;
  timestampMs: number;
  replayFrame?: ReplayFrame;
  trace?: TraceFullDetailed;
}

export default function useReplayTraceData() {
  const [traceData, setTraceData] = useState<ReplayTraceRow[]>([]);
  const {replay} = useReplayContext();

  const {
    state: {didInit: _didInit, errors: _errors, isFetching: _isFetching, traces = []},
    eventView: _eventView,
  } = useTransactionData();

  useFetchTransactions();

  useEffect(() => {
    if (!replay) {
      return;
    }
    const startTimestampMs = replay.getReplay().started_at.getTime();

    // Clone the list because we're going to mutate it
    const frames = [...replay.getTimelineFrames()];

    const data: ReplayTraceRow[] = [];

    while (frames.length) {
      const thisFrame = frames.shift()!;
      const nextFrame = frames[0];

      data.push({
        durationMs: nextFrame ? nextFrame.timestampMs - thisFrame.timestampMs : 0,
        offsetMs: thisFrame.offsetMs,
        replayFrame: thisFrame,
        timestampMs: thisFrame.timestampMs,
      });

      const tracesAfterThis = traces.filter(
        trace => trace.start_timestamp * 1000 >= thisFrame.timestampMs
      );
      const relatedTraces = nextFrame
        ? tracesAfterThis.filter(
            trace => trace.start_timestamp * 1000 < nextFrame.timestampMs
          )
        : tracesAfterThis;
      relatedTraces.forEach(trace => {
        const traceTimestampMS = trace.start_timestamp * 1000;
        data.push({
          durationMs: trace['transaction.duration'],
          offsetMs: traceTimestampMS - startTimestampMs,
          timestampMs: traceTimestampMS,
          trace,
        });
      });
    }

    setTraceData(data);
  }, [replay, traces]);

  return {
    traceData,
  };
}
