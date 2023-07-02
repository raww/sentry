import {ComponentProps, CSSProperties, forwardRef} from 'react';

import {Cell, Text} from 'sentry/components/replays/virtualizedGrid/bodyCell';
import {getTitle} from 'sentry/utils/replays/frame';
import useSortNetwork from 'sentry/views/replays/detail/network/useSortNetwork';
// import type {TraceFullDetailed} from 'sentry/utils/performance/quickTrace/types';
import type {ReplayTraceRow} from 'sentry/views/replays/detail/traceTable/useReplayTraceData';
// const EMPTY_CELL = '--';

type Props = {
  columnIndex: number;
  currentHoverTime: number | undefined;
  currentTime: number;
  onClickCell: (props: {dataIndex: number; rowIndex: number}) => void;
  onClickTimestamp: (crumb: ReplayTraceRow) => void;
  onMouseEnter: (span: ReplayTraceRow) => void;
  onMouseLeave: (span: ReplayTraceRow) => void;
  rowIndex: number;
  sortConfig: ReturnType<typeof useSortNetwork>['sortConfig'];
  // startTimestampMs: number;
  style: CSSProperties;
  traceRow: ReplayTraceRow;
};

const TraceTableCell = forwardRef<HTMLDivElement, Props>(
  (
    {
      columnIndex,
      currentHoverTime,
      currentTime,
      onMouseEnter,
      onMouseLeave,
      onClickCell,
      onClickTimestamp,
      rowIndex,
      sortConfig,
      traceRow,
      // startTimestampMs,
      style,
    }: Props,
    ref
  ) => {
    // Rows include the sortable header, the dataIndex does not
    const dataIndex = rowIndex - 1;

    // const {getParamValue} = useUrlParams('n_detail_row', '');
    // const isSelected = getParamValue() === String(dataIndex);

    // const startMs = span.startTimestamp * 1000;
    // const endMs = span.endTimestamp * 1000;
    // const method = span.data.method;
    // const statusCode = span.data.statusCode;
    // `data.responseBodySize` is from SDK version 7.44-7.45
    // const size = span.data.size ?? span.data.response?.size ?? span.data.responseBodySize;

    // const spanTime = useMemo(
    //   () => relativeTimeInMs(span.startTimestamp * 1000, startTimestampMs),
    //   [span.startTimestamp, startTimestampMs]
    // );
    // const hasOccurred = currentTime >= spanTime;
    // const isBeforeHover = currentHoverTime === undefined || currentHoverTime >= spanTime;

    // const isByTimestamp = sortConfig.by === 'startTimestamp';
    // const isAsc = isByTimestamp ? sortConfig.asc : undefined;
    const columnProps = {
      // className: classNames({
      //   beforeCurrentTime: isByTimestamp
      //     ? isAsc
      //       ? hasOccurred
      //       : !hasOccurred
      //     : undefined,
      //   afterCurrentTime: isByTimestamp
      //     ? isAsc
      //       ? !hasOccurred
      //       : hasOccurred
      //     : undefined,
      //   beforeHoverTime:
      //     isByTimestamp && currentHoverTime !== undefined
      //       ? isAsc
      //         ? isBeforeHover
      //         : !isBeforeHover
      //       : undefined,
      //   afterHoverTime:
      //     isByTimestamp && currentHoverTime !== undefined
      //       ? isAsc
      //         ? !isBeforeHover
      //         : isBeforeHover
      //       : undefined,
      // }),
      // hasOccurred: isByTimestamp ? hasOccurred : undefined,
      // isSelected,
      // isStatusError: typeof statusCode === 'number' && statusCode >= 400,
      onClick: () => onClickCell({dataIndex, rowIndex}),
      onMouseEnter: () => onMouseEnter(traceRow),
      onMouseLeave: () => onMouseLeave(traceRow),
      ref,
      style,
    } as ComponentProps<typeof Cell>;

    const renderFns = [
      () => (
        <Cell {...columnProps}>
          <Text>
            {'replayFrame' in traceRow ? getTitle(traceRow.replayFrame!) : 'Trace'}
          </Text>
        </Cell>
      ),
      () => (
        <Cell {...columnProps}>
          <Text>{traceRow.durationMs}</Text>
        </Cell>
      ),
      // () => (
      //   <Cell {...columnProps}>
      //     <Text>{trace['transaction.op']}</Text>
      //   </Cell>
      // ),
      // () => (
      //   <Cell {...columnProps}>
      //     <Text>{trace.transaction}</Text>
      //   </Cell>
      // ),
      // () => (
      //   <Cell {...columnProps}>
      //     <Text>{trace['transaction.duration']}</Text>
      //   </Cell>
      // ),
      // () => (
      //   <Cell {...columnProps}>
      //     <Text>{new Date(trace.start_timestamp * 1000).toISOString()}</Text>
      //   </Cell>
      // ),
      // () => (
      //   <Cell {...columnProps}>
      //     <Text>{new Date(trace.timestamp * 1000).toISOString()}</Text>
      //   </Cell>
      // ),
    ];

    return renderFns[columnIndex]();
  }
);

export default TraceTableCell;
