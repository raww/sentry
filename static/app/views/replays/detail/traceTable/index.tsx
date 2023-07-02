import TraceTable from 'sentry/views/replays/detail/traceTable/traceTable';
import useReplayTraceData from 'sentry/views/replays/detail/traceTable/useReplayTraceData';

type Props = {};

function Traces({}: Props) {
  // const {replay} = useReplayContext();

  // const {
  //   state: {didInit: _didInit, errors: _errors, isFetching: _isFetching, traces = []},
  //   eventView: _eventView,
  // } = useTransactionData();

  // useFetchTransactions();

  // const startTimestampMs = replay?.getReplay().started_at.getTime() ?? 0;
  // const navigationFrames = replay?.getNavigationFrames() ?? [];

  // const records = [...navigationFrames, traces];
  const {traceData} = useReplayTraceData();

  console.log({traceData});
  return (
    <TraceTable
      // navigationFrames={navigationFrames}
      // startTimestampMs={startTimestampMs}
      // traces={traces}
      traceData={traceData}
    />
  );
}

export default Traces;
