import React, { useEffect, useState, useMemo, forwardRef, useRef } from 'react';
import embed from 'vega-embed';
import { Subject } from 'rxjs'
import * as op from 'rxjs/operators';
import type { ScenegraphEvent } from 'vega';
import styled from 'styled-components';

import { useVegaExportApi } from '../utils/vegaApiExport';
import { IViewField, IRow, IStackMode, VegaGlobalConfig, IVegaChartRef } from '../interfaces';
import { getVegaTimeFormatRules } from './temporalFormat';
import { getSingleView } from './spec/view';
import { NULL_FIELD } from './spec/field';

const CanvaContainer = styled.div<{rowSize: number; colSize: number;}>`
  display: grid;
  grid-template-columns: repeat(${props => props.colSize}, 1fr);
  grid-template-rows: repeat(${props => props.rowSize}, 1fr);
`

const SELECTION_NAME = 'geom';
export interface IReactVegaHandler {
  getSVGData: () => Promise<string[]>;
  getCanvasData: () => Promise<string[]>;
  downloadSVG: (filename?: string) => Promise<string[]>;
  downloadPNG: (filename?: string) => Promise<string[]>;
}
interface ReactVegaProps {
  name?: string;
  rows: Readonly<IViewField[]>;
  columns: Readonly<IViewField[]>;
  dataSource: readonly IRow[];
  defaultAggregate?: boolean;
  stack: IStackMode;
  interactiveScale: boolean;
  geomType: string;
  color?: IViewField;
  opacity?: IViewField;
  size?: IViewField;
  shape?: IViewField;
  theta?: IViewField;
  radius?: IViewField;
  text?: IViewField;
  details?: Readonly<IViewField[]>;
  showActions: boolean;
  layoutMode: string;
  width: number;
  height: number;
  onGeomClick?: (values: any, e: any) => void
  vegaConfig: VegaGlobalConfig;
  /** @default "en-US" */
  locale?: string;
}

const click$ = new Subject<ScenegraphEvent>();
const selection$ = new Subject<any>();
const geomClick$ = selection$.pipe(
  op.withLatestFrom(click$),
  op.filter(([values, _]) => {
    if (Object.keys(values).length > 0) {
      return true
    }
    return false
  })
);

const ReactVega = forwardRef<IReactVegaHandler, ReactVegaProps>(function ReactVega (props, ref) {
  const {
    name,
    dataSource = [],
    rows = [],
    columns = [],
    defaultAggregate = true,
    stack = 'stack',
    geomType,
    color,
    opacity,
    size,
    theta,
    radius,
    shape,
    text,
    onGeomClick,
    showActions,
    interactiveScale,
    layoutMode,
    width,
    height,
    details = [],
    // themeKey = 'vega',
    // dark = 'media',
    vegaConfig,
    // format
    locale = 'en-US',
  } = props;
  const [viewPlaceholders, setViewPlaceholders] = useState<React.MutableRefObject<HTMLDivElement>[]>([]);

  useEffect(() => {
    const clickSub = geomClick$.subscribe(([values, e]) => {
      if (onGeomClick) {
        onGeomClick(values, e);
      }
    })
    return () => {
      clickSub.unsubscribe();
    }
  }, [onGeomClick]);
  const rowDims = useMemo(() => rows.filter(f => f.analyticType === 'dimension'), [rows]);
  const colDims = useMemo(() => columns.filter(f => f.analyticType === 'dimension'), [columns]);
  const rowMeas = useMemo(() => rows.filter(f => f.analyticType === 'measure'), [rows]);
  const colMeas = useMemo(() => columns.filter(f => f.analyticType === 'measure'), [columns]);
  const rowFacetFields = useMemo(() => rowDims.slice(0, -1), [rowDims]);
  const colFacetFields = useMemo(() => colDims.slice(0, -1), [colDims]);
  const rowRepeatFields = useMemo(() => rowMeas.length === 0 ? rowDims.slice(-1) : rowMeas, [rowDims, rowMeas]);//rowMeas.slice(0, -1);
  const colRepeatFields = useMemo(() => colMeas.length === 0 ? colDims.slice(-1) : colMeas, [rowDims, rowMeas]);//colMeas.slice(0, -1);
  const allFieldIds = useMemo(() => [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as IViewField).fid), [rows, columns, color, opacity, size]);

  useEffect(() => {
    setViewPlaceholders(views => {
      const viewNum = Math.max(1, rowRepeatFields.length * colRepeatFields.length)
      const nextViews = new Array(viewNum).fill(null).map((v, i) => views[i] || React.createRef())
      return nextViews;
    })
  }, [rowRepeatFields, colRepeatFields])

  const vegaRefs = useRef<IVegaChartRef[]>([]);
  const renderTaskRefs = useRef<Promise<unknown>[]>([]);

  useEffect(() => {
    vegaRefs.current = [];
    renderTaskRefs.current = [];

    const yField = rows.length > 0 ? rows[rows.length - 1] : NULL_FIELD;
    const xField = columns.length > 0 ? columns[columns.length - 1] : NULL_FIELD;

    const rowLeftFacetFields = rows.slice(0, -1).filter(f => f.analyticType === 'dimension');
    const colLeftFacetFields = columns.slice(0, -1).filter(f => f.analyticType === 'dimension');

    const rowFacetField = rowLeftFacetFields.length > 0 ? rowLeftFacetFields[rowLeftFacetFields.length - 1] : NULL_FIELD;
    const colFacetField = colLeftFacetFields.length > 0 ? colLeftFacetFields[colLeftFacetFields.length - 1] : NULL_FIELD;

    const spec: any = {
      data: {
        values: dataSource,
      },
      params: [{
        name: SELECTION_NAME,
        select: {
          type: 'point',
          fields: allFieldIds
        }
      }]
    };
    if (interactiveScale) {
      spec.params.push({
        name: "grid",
        select: "interval",
        bind: "scales"
      })
    }
    if (rowRepeatFields.length <= 1 && colRepeatFields.length <= 1) {
      if (layoutMode === 'fixed') {
        if (rowFacetField === NULL_FIELD && colFacetField === NULL_FIELD) {
          spec.autosize = 'fit'
        }
        spec.width = width;
        spec.height = height;
      }
      const singleView = getSingleView({
        x: xField,
        y: yField,
        color: color ? color : NULL_FIELD,
        opacity: opacity ? opacity : NULL_FIELD,
        size: size ? size : NULL_FIELD,
        shape: shape ? shape : NULL_FIELD,
        theta: theta ? theta : NULL_FIELD,
        radius: radius ? radius : NULL_FIELD,
        text: text ? text : NULL_FIELD,
        row: rowFacetField,
        column: colFacetField,
        xOffset: NULL_FIELD,
        yOffset: NULL_FIELD,
        details,
        defaultAggregated: defaultAggregate,
        stack,
        geomType,
      });

      spec.mark = singleView.mark;
      if ('encoding' in singleView) {
        spec.encoding = singleView.encoding;
      }

      if (viewPlaceholders.length > 0 && viewPlaceholders[0].current) {
        const task = embed(viewPlaceholders[0].current, spec, { mode: 'vega-lite', actions: showActions, timeFormatLocale: getVegaTimeFormatRules(locale), config: vegaConfig }).then(res => {
          const container = res.view.container();
          const canvas = container?.querySelector('canvas') ?? null;
          vegaRefs.current = [{
            w: container?.clientWidth ?? res.view.width(),
            h: container?.clientHeight ?? res.view.height(),
            innerWidth: canvas?.clientWidth ?? res.view.width(),
            innerHeight: canvas?.clientHeight ?? res.view.height(),
            x: 0,
            y: 0,
            view: res.view,
            canvas,
          }];
          try {
            res.view.addEventListener('click', (e) => {
              click$.next(e);
            })
            res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
              selection$.next(values);
            }); 
          } catch (error) {
            console.warn(error)
          }
        });
        renderTaskRefs.current = [task];
      }
    } else {
      if (layoutMode === 'fixed') {
        spec.width = Math.floor(width / colRepeatFields.length) - 5;
        spec.height = Math.floor(height / rowRepeatFields.length) - 5;
        spec.autosize = 'fit'
      }
      let index = 0;
      vegaRefs.current = new Array(rowRepeatFields.length * colRepeatFields.length);
      for (let i = 0; i < rowRepeatFields.length; i++) {
        for (let j = 0; j < colRepeatFields.length; j++, index++) {
          const hasLegend = i === 0 && j === colRepeatFields.length - 1;
          const singleView = getSingleView({
            x: colRepeatFields[j] || NULL_FIELD,
            y: rowRepeatFields[i] || NULL_FIELD,
            color: color ? color : NULL_FIELD,
            opacity: opacity ? opacity : NULL_FIELD,
            size: size ? size : NULL_FIELD,
            shape: shape ? shape : NULL_FIELD,
            theta: theta ? theta : NULL_FIELD,
            radius: radius ? radius : NULL_FIELD,
            row: rowFacetField,
            column: colFacetField,
            text: text ? text : NULL_FIELD,
            xOffset: NULL_FIELD,
            yOffset: NULL_FIELD,
            details,
            defaultAggregated: defaultAggregate,
            stack,
            geomType,
            hideLegend: !hasLegend,
          });
          const node = i * colRepeatFields.length + j < viewPlaceholders.length ? viewPlaceholders[i * colRepeatFields.length + j].current : null
          let commonSpec = { ...spec };

          const ans = { ...commonSpec, ...singleView }
          if ('params' in commonSpec) {
            ans.params = commonSpec.params;
          }
          if (node) {
            const id = index;
            const task = embed(node, ans, { mode: 'vega-lite', actions: showActions, timeFormatLocale: getVegaTimeFormatRules(locale), config: vegaConfig }).then(res => {
              const container = res.view.container();
              const canvas = container?.querySelector('canvas') ?? null;
              vegaRefs.current[id] = {
                w: container?.clientWidth ?? res.view.width(),
                h: container?.clientHeight ?? res.view.height(),
                innerWidth: canvas?.clientWidth ?? res.view.width(),
                innerHeight: canvas?.clientHeight ?? res.view.height(),
                x: j,
                y: i,
                view: res.view,
                canvas,
              };
              try {
                res.view.addEventListener('click', (e) => {
                  click$.next(e);
                })
                res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
                  selection$.next(values);
                }); 
              } catch (error) {
                console.warn(error);
              }
            })
            renderTaskRefs.current.push(task);
          }
        }
      }
    }
    return () => {
      vegaRefs.current = [];
      renderTaskRefs.current = [];
    };
  }, [
    dataSource,
    allFieldIds,
    rows,
    columns,
    defaultAggregate,
    geomType,
    color,
    opacity,
    size,
    shape,
    theta, radius,
    viewPlaceholders,
    rowFacetFields,
    colFacetFields,
    rowRepeatFields,
    colRepeatFields,
    stack,
    showActions,
    interactiveScale,
    layoutMode,
    width,
    height,
    vegaConfig,
    details,
    text
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  useVegaExportApi(name, vegaRefs, ref, renderTaskRefs, containerRef);

  return <CanvaContainer rowSize={Math.max(rowRepeatFields.length, 1)} colSize={Math.max(colRepeatFields.length, 1)} ref={containerRef}>
    {/* <div ref={container}></div> */}
    {
      viewPlaceholders.map((view, i) => <div key={i} ref={view}></div>)
    }
  </CanvaContainer>
});

export default ReactVega;
