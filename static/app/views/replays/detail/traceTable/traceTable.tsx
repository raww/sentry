import {useMemo, useRef, useState} from 'react';
import {AutoSizer, CellMeasurer, GridCellProps, MultiGrid} from 'react-virtualized';
import styled from '@emotion/styled';

import Placeholder from 'sentry/components/placeholder';
import {useReplayContext} from 'sentry/components/replays/replayContext';
import {t} from 'sentry/locale';
// import type {TraceFullDetailed} from 'sentry/utils/performance/quickTrace/types';
// import type {ReplayFrame} from 'sentry/utils/replays/types';
import FluidHeight from 'sentry/views/replays/detail/layout/fluidHeight';
import NoRowRenderer from 'sentry/views/replays/detail/noRowRenderer';
import TraceHeaderCell, {
  COLUMN_COUNT,
} from 'sentry/views/replays/detail/traceTable/traceHeaderCell';
import TraceTableCell from 'sentry/views/replays/detail/traceTable/traceTableCell';
import type {ReplayTraceRow} from 'sentry/views/replays/detail/traceTable/useReplayTraceData';
import useVirtualizedGrid from 'sentry/views/replays/detail/useVirtualizedGrid';

const HEADER_HEIGHT = 25;
const BODY_HEIGHT = 28;

interface Props {
  // navigationFrames: ReplayFrame[];
  // records: Array<ReplayFrame | TraceFullDetailed>;
  // startTimestampMs: number;
  // traces: TraceFullDetailed[];
  traceData: ReplayTraceRow[];
}

const cellMeasurer = {
  defaultHeight: BODY_HEIGHT,
  defaultWidth: 100,
  fixedHeight: true,
};

function TraceTable({traceData}: Props) {
  // if (traces.length) {
  //   console.log({traces});
  // }
  // if (navigationFrames) {
  //   console.log({navigationFrames});
  // }
  // const txns = collateData({
  //   startTimestampMs,
  //   navigationFrames: [...navigationFrames],
  //   traces: [...traces],
  // });
  // console.log({txns});

  const {currentTime, currentHoverTime} = useReplayContext();

  const [scrollToRow, setScrollToRow] = useState<undefined | number>(undefined);

  const items = traceData;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<MultiGrid>(null);
  const deps = useMemo(() => [], []);
  const {cache, getColumnWidth, onScrollbarPresenceChange, onWrapperResize} =
    useVirtualizedGrid({
      cellMeasurer,
      gridRef,
      columnCount: COLUMN_COUNT,
      dynamicColumnIndex: 0,
      deps,
    });

  const cellRenderer = ({columnIndex, rowIndex, key, style, parent}: GridCellProps) => {
    const traceRow = items[rowIndex - 1];

    return (
      <CellMeasurer
        cache={cache}
        columnIndex={columnIndex}
        key={key}
        parent={parent}
        rowIndex={rowIndex}
      >
        {({
          measure: _,
          registerChild,
        }: {
          measure: () => void;
          registerChild?: (element?: Element) => void;
        }) =>
          rowIndex === 0 ? (
            <TraceHeaderCell
              ref={e => e && registerChild?.(e)}
              handleSort={() => {}}
              index={columnIndex}
              sortConfig={{asc: true, by: 'id', getValue: () => {}}}
              style={{...style, height: HEADER_HEIGHT}}
            />
          ) : (
            <TraceTableCell
              columnIndex={columnIndex}
              currentHoverTime={currentHoverTime}
              currentTime={currentTime}
              onClickCell={() => {}}
              onClickTimestamp={() => {}}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
              ref={e => e && registerChild?.(e)}
              rowIndex={rowIndex}
              sortConfig={{asc: true, by: 'id', getValue: () => {}}}
              traceRow={traceRow}
              // startTimestampMs={startTimestampMs}
              style={{...style, height: BODY_HEIGHT}}
            />
          )
        }
      </CellMeasurer>
    );
  };

  return (
    <FluidHeight>
      <Table ref={containerRef}>
        {traceData ? (
          <OverflowHidden>
            <AutoSizer onResize={onWrapperResize}>
              {({height, width}) => (
                <MultiGrid
                  ref={gridRef}
                  cellRenderer={cellRenderer}
                  columnCount={COLUMN_COUNT}
                  columnWidth={getColumnWidth(width)}
                  deferredMeasurementCache={cache}
                  estimatedColumnSize={100}
                  estimatedRowSize={BODY_HEIGHT}
                  fixedRowCount={1}
                  height={height}
                  noContentRenderer={() => (
                    <NoRowRenderer unfilteredItems={traceData} clearSearchTerm={() => {}}>
                      {t('No traces found')}
                    </NoRowRenderer>
                  )}
                  onScrollbarPresenceChange={onScrollbarPresenceChange}
                  onScroll={() => {
                    if (scrollToRow !== undefined) {
                      setScrollToRow(undefined);
                    }
                  }}
                  scrollToRow={scrollToRow}
                  overscanColumnCount={COLUMN_COUNT}
                  overscanRowCount={5}
                  rowCount={items.length + 1}
                  rowHeight={({index}) => (index === 0 ? HEADER_HEIGHT : BODY_HEIGHT)}
                  width={width}
                />
              )}
            </AutoSizer>
          </OverflowHidden>
        ) : (
          <Placeholder height="100%" />
        )}
      </Table>
    </FluidHeight>
  );
}

const OverflowHidden = styled('div')`
  position: relative;
  height: 100%;
  overflow: hidden;
`;

const Table = styled(FluidHeight)`
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};

  .beforeHoverTime + .afterHoverTime:before {
    border-top: 1px solid ${p => p.theme.purple200};
    content: '';
    left: 0;
    position: absolute;
    top: 0;
    width: 999999999%;
  }

  .beforeHoverTime:last-child:before {
    border-bottom: 1px solid ${p => p.theme.purple200};
    content: '';
    right: 0;
    position: absolute;
    bottom: 0;
    width: 999999999%;
  }

  .beforeCurrentTime + .afterCurrentTime:before {
    border-top: 1px solid ${p => p.theme.purple300};
    content: '';
    left: 0;
    position: absolute;
    top: 0;
    width: 999999999%;
  }

  .beforeCurrentTime:last-child:before {
    border-bottom: 1px solid ${p => p.theme.purple300};
    content: '';
    right: 0;
    position: absolute;
    bottom: 0;
    width: 999999999%;
  }
`;

export default TraceTable;
