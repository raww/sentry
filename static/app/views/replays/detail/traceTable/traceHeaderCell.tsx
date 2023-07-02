import {ComponentProps, CSSProperties, forwardRef} from 'react';

import HeaderCell from 'sentry/components/replays/virtualizedGrid/headerCell';
import {Tooltip} from 'sentry/components/tooltip';
import {t} from 'sentry/locale';
import useSortNetwork from 'sentry/views/replays/detail/network/useSortNetwork';

type SortConfig = ReturnType<typeof useSortNetwork>['sortConfig'];
type Props = {
  handleSort: ReturnType<typeof useSortNetwork>['handleSort'];
  index: number;
  sortConfig: SortConfig;
  style: CSSProperties;
};

const COLUMNS: {
  field: SortConfig['by'];
  label: string;
  tooltipTitle?: ComponentProps<typeof Tooltip>['title'];
}[] = [
  {field: 'timestampMs', label: t('Type')},
  {field: 'durationMs', label: t('Duration')},
  // {field: 'op', label: t('Op')},
  // {field: 'transaction', label: t('Transaction')},
  // {field: 'duration', label: t('Duration')},
  // {field: 'start_timestamp', label: t('Start TS')},
  // {field: 'timestamp', label: t('End TS')},
];

export const COLUMN_COUNT = COLUMNS.length;

const TraceHeaderCell = forwardRef<HTMLButtonElement, Props>(
  ({handleSort, index, sortConfig, style}: Props, ref) => {
    const {field, label, tooltipTitle} = COLUMNS[index];
    return (
      <HeaderCell
        ref={ref}
        handleSort={handleSort}
        field={field}
        label={label}
        tooltipTitle={tooltipTitle}
        sortConfig={sortConfig}
        style={style}
      />
    );
  }
);

export default TraceHeaderCell;
