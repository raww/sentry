import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import * as qs from 'query-string';

import Breadcrumbs, {Crumb} from 'sentry/components/breadcrumbs';
import * as Layout from 'sentry/components/layouts/thirds';
import Panel from 'sentry/components/panels/panel';
import PanelBody from 'sentry/components/panels/panelBody';
import QuestionTooltip from 'sentry/components/questionTooltip';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t, tct} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {fromSorts} from 'sentry/utils/discover/eventView';
import {RateUnits, Sort} from 'sentry/utils/discover/fields';
import {formatRate} from 'sentry/utils/formatters';
import {
  PageErrorAlert,
  PageErrorProvider,
} from 'sentry/utils/performance/contexts/pageError';
import useOrganization from 'sentry/utils/useOrganization';
import {normalizeUrl} from 'sentry/utils/withDomainRequired';
import {AVG_COLOR, ERRORS_COLOR, THROUGHPUT_COLOR} from 'sentry/views/starfish/colours';
import Chart, {useSynchronizeCharts} from 'sentry/views/starfish/components/chart';
import ChartPanel from 'sentry/views/starfish/components/chartPanel';
import StarfishDatePicker from 'sentry/views/starfish/components/datePicker';
import {SpanDescription} from 'sentry/views/starfish/components/spanDescription';
import {StarfishPageFiltersContainer} from 'sentry/views/starfish/components/starfishPageFiltersContainer';
import {CountCell} from 'sentry/views/starfish/components/tableCells/countCell';
import DurationCell from 'sentry/views/starfish/components/tableCells/durationCell';
import ThroughputCell from 'sentry/views/starfish/components/tableCells/throughputCell';
import {TimeSpentCell} from 'sentry/views/starfish/components/tableCells/timeSpentCell';
import {useFullSpanDescription} from 'sentry/views/starfish/queries/useFullSpanDescription';
import {
  SpanSummaryQueryFilters,
  useSpanMetrics,
} from 'sentry/views/starfish/queries/useSpanMetrics';
import {useSpanMetricsSeries} from 'sentry/views/starfish/queries/useSpanMetricsSeries';
import {SpanMetricsFields} from 'sentry/views/starfish/types';
import {extractRoute} from 'sentry/views/starfish/utils/extractRoute';
import {ROUTE_NAMES} from 'sentry/views/starfish/utils/routeNames';
import {QueryParameterNames} from 'sentry/views/starfish/views/queryParameters';
import {
  DataTitles,
  getThroughputChartTitle,
  getThroughputTitle,
} from 'sentry/views/starfish/views/spans/types';
import {SampleList} from 'sentry/views/starfish/views/spanSummaryPage/sampleList';
import {
  isAValidSort,
  SpanTransactionsTable,
} from 'sentry/views/starfish/views/spanSummaryPage/spanTransactionsTable';

const DEFAULT_SORT: Sort = {
  kind: 'desc',
  field: 'time_spent_percentage(local)',
};

type Props = {
  location: Location;
} & RouteComponentProps<{groupId: string}, {transaction: string}>;

function SpanSummaryPage({params, location}: Props) {
  const organization = useOrganization();
  const {groupId} = params;
  const {transaction, transactionMethod, endpoint, endpointMethod} = location.query;

  const {data: fullSpanDescription} = useFullSpanDescription(groupId);

  const queryFilter: SpanSummaryQueryFilters = endpoint
    ? {transactionName: endpoint, 'transaction.method': endpointMethod}
    : {};
  const sort =
    fromSorts(location.query[QueryParameterNames.SORT]).filter(isAValidSort)[0] ??
    DEFAULT_SORT; // We only allow one sort on this table in this view

  if (endpointMethod && queryFilter) {
    queryFilter['transaction.method'] = endpointMethod;
  }

  const {data: spanMetrics, isLoading: isSpanMetricsLoading} = useSpanMetrics(
    groupId,
    queryFilter,
    [
      SpanMetricsFields.SPAN_OP,
      SpanMetricsFields.SPAN_DESCRIPTION,
      SpanMetricsFields.SPAN_ACTION,
      SpanMetricsFields.SPAN_DOMAIN,
      'count()',
      'spm()',
      `sum(${SpanMetricsFields.SPAN_SELF_TIME})`,
      `avg(${SpanMetricsFields.SPAN_SELF_TIME})`,
      'time_spent_percentage()',
      'http_error_count()',
    ],
    'api.starfish.span-summary-page-metrics'
  );

  const span = {
    ...spanMetrics,
    [SpanMetricsFields.SPAN_GROUP]: groupId,
  } as {
    [SpanMetricsFields.SPAN_OP]: string;
    [SpanMetricsFields.SPAN_DESCRIPTION]: string;
    [SpanMetricsFields.SPAN_ACTION]: string;
    [SpanMetricsFields.SPAN_DOMAIN]: string;
    [SpanMetricsFields.SPAN_GROUP]: string;
  };

  const {isLoading: areSpanMetricsSeriesLoading, data: spanMetricsSeriesData} =
    useSpanMetricsSeries(
      groupId,
      queryFilter,
      [`avg(${SpanMetricsFields.SPAN_SELF_TIME})`, 'spm()', 'http_error_count()'],
      'api.starfish.span-summary-page-metrics-chart'
    );

  useSynchronizeCharts([!areSpanMetricsSeriesLoading]);

  const spanMetricsThroughputSeries = {
    seriesName: span?.[SpanMetricsFields.SPAN_OP]?.startsWith('db')
      ? 'Queries'
      : 'Requests',
    data: spanMetricsSeriesData?.['spm()'].data,
  };

  const title = getDescriptionLabel(span[SpanMetricsFields.SPAN_OP], true);
  const spanDescriptionCardTitle = getDescriptionLabel(span[SpanMetricsFields.SPAN_OP]);

  const crumbs: Crumb[] = [];
  crumbs.push({
    label: t('Web Service'),
    to: normalizeUrl(`/organizations/${organization.slug}/starfish/`),
  });
  const extractedRoute = extractRoute(location);
  if (extractedRoute && ROUTE_NAMES[extractedRoute]) {
    crumbs.push({
      label: ROUTE_NAMES[extractedRoute],
      to: normalizeUrl(
        `/organizations/${organization.slug}/starfish/${
          extractedRoute ?? 'spans'
        }/?${qs.stringify({
          endpoint,
          'http.method': endpointMethod,
        })}`
      ),
    });
  }
  crumbs.push({
    label: title,
  });

  return (
    <SentryDocumentTitle title={title} orgSlug={organization.slug}>
      <Layout.Page>
        <StarfishPageFiltersContainer>
          <PageErrorProvider>
            <Layout.Header>
              <Layout.HeaderContent>
                {!isSpanMetricsLoading && <Breadcrumbs crumbs={crumbs} />}
                <Layout.Title>
                  {endpointMethod && endpoint
                    ? `${endpointMethod} ${endpoint}`
                    : !isSpanMetricsLoading && title}
                </Layout.Title>
              </Layout.HeaderContent>
            </Layout.Header>
            <Layout.Body>
              <Layout.Main fullWidth>
                <PageErrorAlert />
                <BlockContainer>
                  <FilterOptionsContainer>
                    <StarfishDatePicker />
                  </FilterOptionsContainer>
                  <BlockContainer>
                    {span?.[SpanMetricsFields.SPAN_OP]?.startsWith('db') &&
                      span?.[SpanMetricsFields.SPAN_OP] !== 'db.redis' && (
                        <Block title={t('Table')}>
                          {span?.[SpanMetricsFields.SPAN_DOMAIN]}
                        </Block>
                      )}
                    <Block
                      title={getThroughputTitle(span?.[SpanMetricsFields.SPAN_OP])}
                      description={tct('Throughput of this [spanType] per minute', {
                        spanType: spanDescriptionCardTitle,
                      })}
                    >
                      <ThroughputCell
                        rate={spanMetrics?.['spm()']}
                        unit={RateUnits.PER_MINUTE}
                      />
                    </Block>
                    <Block
                      title={DataTitles.avg}
                      description={tct(
                        'The average duration of [spanType] in the selected period',
                        {
                          spanType: spanDescriptionCardTitle.endsWith('y')
                            ? `${spanDescriptionCardTitle.slice(0, -1)}ies`
                            : `${spanDescriptionCardTitle}s`,
                        }
                      )}
                    >
                      <DurationCell
                        milliseconds={
                          spanMetrics?.[`avg(${SpanMetricsFields.SPAN_SELF_TIME})`]
                        }
                      />
                    </Block>
                    {span?.[SpanMetricsFields.SPAN_OP]?.startsWith('http') && (
                      <Block
                        title={t('5XX Responses')}
                        description={t('5XX responses in this span')}
                      >
                        <CountCell count={spanMetrics?.[`http_error_count()`]} />
                      </Block>
                    )}
                    <Block
                      title={t('Time Spent')}
                      description={t(
                        'Time spent in this span as a proportion of total application time'
                      )}
                    >
                      <TimeSpentCell
                        percentage={spanMetrics?.['time_spent_percentage()']}
                        total={spanMetrics?.[`avg(${SpanMetricsFields.SPAN_SELF_TIME})`]}
                      />
                    </Block>
                  </BlockContainer>
                </BlockContainer>

                {span?.[SpanMetricsFields.SPAN_DESCRIPTION] && (
                  <BlockContainer>
                    <Block>
                      <Panel>
                        <DescriptionPanelBody>
                          <DescriptionContainer>
                            <DescriptionTitle>
                              {spanDescriptionCardTitle}
                            </DescriptionTitle>
                            <SpanDescription
                              span={{
                                ...span,
                                [SpanMetricsFields.SPAN_DESCRIPTION]:
                                  fullSpanDescription ??
                                  spanMetrics?.[SpanMetricsFields.SPAN_DESCRIPTION],
                              }}
                            />
                          </DescriptionContainer>
                        </DescriptionPanelBody>
                      </Panel>
                    </Block>
                  </BlockContainer>
                )}

                <BlockContainer>
                  <Block>
                    <ChartPanel
                      title={getThroughputChartTitle(span?.[SpanMetricsFields.SPAN_OP])}
                    >
                      <Chart
                        height={140}
                        data={[spanMetricsThroughputSeries]}
                        loading={areSpanMetricsSeriesLoading}
                        utc={false}
                        chartColors={[THROUGHPUT_COLOR]}
                        isLineChart
                        definedAxisTicks={4}
                        aggregateOutputFormat="rate"
                        rateUnit={RateUnits.PER_MINUTE}
                        tooltipFormatterOptions={{
                          valueFormatter: value =>
                            formatRate(value, RateUnits.PER_MINUTE),
                        }}
                      />
                    </ChartPanel>
                  </Block>

                  <Block>
                    <ChartPanel title={DataTitles.avg}>
                      <Chart
                        height={140}
                        data={[
                          spanMetricsSeriesData?.[
                            `avg(${SpanMetricsFields.SPAN_SELF_TIME})`
                          ],
                        ]}
                        loading={areSpanMetricsSeriesLoading}
                        utc={false}
                        chartColors={[AVG_COLOR]}
                        isLineChart
                        definedAxisTicks={4}
                      />
                    </ChartPanel>
                  </Block>

                  {span?.[SpanMetricsFields.SPAN_OP]?.startsWith('http') && (
                    <Block>
                      <ChartPanel title={DataTitles.errorCount}>
                        <Chart
                          height={140}
                          data={[spanMetricsSeriesData?.[`http_error_count()`]]}
                          loading={areSpanMetricsSeriesLoading}
                          utc={false}
                          chartColors={[ERRORS_COLOR]}
                          isLineChart
                          definedAxisTicks={4}
                        />
                      </ChartPanel>
                    </Block>
                  )}
                </BlockContainer>

                {span && (
                  <SpanTransactionsTable
                    span={span}
                    sort={sort}
                    endpoint={endpoint}
                    endpointMethod={endpointMethod}
                  />
                )}

                <SampleList
                  groupId={span[SpanMetricsFields.SPAN_GROUP]}
                  transactionName={transaction}
                  transactionMethod={transactionMethod}
                />
              </Layout.Main>
            </Layout.Body>
          </PageErrorProvider>
        </StarfishPageFiltersContainer>
      </Layout.Page>
    </SentryDocumentTitle>
  );
}

const FilterOptionsContainer = styled('div')`
  display: flex;
  flex-direction: row;
  gap: ${space(1)};
  align-items: center;
  flex: 1;
`;

type BlockProps = {
  children: React.ReactNode;
  description?: React.ReactNode;
  title?: React.ReactNode;
};

export function Block({title, description, children}: BlockProps) {
  return (
    <BlockWrapper>
      {title && (
        <BlockTitle>
          {title}
          {description && (
            <BlockTooltipContainer>
              <QuestionTooltip size="sm" position="right" title={description} />
            </BlockTooltipContainer>
          )}
        </BlockTitle>
      )}
      <BlockContent>{children}</BlockContent>
    </BlockWrapper>
  );
}

const BlockTitle = styled('h3')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
  margin: 0;
  margin-bottom: ${space(1)};
  white-space: nowrap;
  display: flex;
  height: ${space(3)};
`;

const BlockContent = styled('h4')`
  margin: 0;
  font-weight: normal;
`;

const BlockTooltipContainer = styled('span')`
  margin-left: ${space(1)};
`;

export const BlockContainer = styled('div')`
  display: flex;
  & > div:last-child {
    padding-right: ${space(1)};
  }
  padding-bottom: ${space(2)};
`;

const DescriptionContainer = styled('div')`
  width: 100%;
  padding: ${space(1)};
  font-size: 1rem;
  line-height: 1.2;
`;

const DescriptionPanelBody = styled(PanelBody)`
  padding: ${space(2)};
`;

const BlockWrapper = styled('div')`
  padding-right: ${space(4)};
  flex: 1;
  min-width: 0;
  word-break: break-word;
`;

const DescriptionTitle = styled('h4')`
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.2;
`;

export default SpanSummaryPage;

const getDescriptionLabel = (spanOp: string, title?: boolean) => {
  if (spanOp?.startsWith('http')) {
    return title ? t('URL Request Summary') : t('URL Request');
  }
  if (spanOp === 'db.redis') {
    return title ? t('Cache Query Summary') : t('Cache Query');
  }
  if (spanOp?.startsWith('db')) {
    return title ? t('Database Query Summary') : t('Database Query');
  }
  if (spanOp?.startsWith('task')) {
    return title ? t('Application Task Summary') : t('Application Task');
  }
  if (spanOp?.startsWith('serialize')) {
    return title ? t('Serializer Summary') : t('Serializer');
  }
  if (spanOp?.startsWith('middleware')) {
    return title ? t('Middleware Summary') : t('Middleware');
  }
  return title ? t('Request Summary') : t('Request');
};
