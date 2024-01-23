import React, { type ForwardedRef, forwardRef, useState } from 'react';
import { DOMProvider } from '@kanaries/react-beautiful-dnd';
import { observer } from 'mobx-react-lite';
import { VizAppWithContext } from './App';
import { ShadowDom } from './shadow-dom';
import AppRoot from './components/appRoot';
import type {
    IDataSourceListener,
    IDataSourceProvider,
    IChart,
    IGWHandler,
    IGWHandlerInsider,
    IGWProps,
    IMutField,
    IRow,
    ITableProps,
    IVizAppProps,
    ILocalComputationProps,
    IRemoteComputationProps,
    IComputationProps,
    IVisualLayout,
    IChartForExport,
    IVisSpecForExport,
} from './interfaces';

import './empty_sheet.css';
import { TableAppWithContext } from './Table';
import { FilterAppWithContext } from './Filter';

export type ILocalVizAppProps = IVizAppProps & ILocalComputationProps & React.RefAttributes<IGWHandler>;
export type IRemoteVizAppProps = IVizAppProps & IRemoteComputationProps & React.RefAttributes<IGWHandler>;

export const GraphicWalker = observer(
    forwardRef<IGWHandler, IVizAppProps & (ILocalComputationProps | IRemoteComputationProps)>((props, ref) => {
        const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

        const handleMount = (shadowRoot: ShadowRoot) => {
            setShadowRoot(shadowRoot);
        };
        const handleUnmount = () => {
            setShadowRoot(null);
        };

        return (
            <AppRoot ref={ref as ForwardedRef<IGWHandlerInsider>}>
                <ShadowDom onMount={handleMount} onUnmount={handleUnmount}>
                    <DOMProvider value={{ head: shadowRoot ?? document.head, body: shadowRoot ?? document.body }}>
                        <VizAppWithContext {...props} />
                    </DOMProvider>
                </ShadowDom>
            </AppRoot>
        );
    })
) as {
    (p: ILocalVizAppProps): JSX.Element;
    (p: IRemoteVizAppProps): JSX.Element;
};

export type IFilterWalkerProps = {
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
    overrideSize?: IVisualLayout['size'];
};

export const FilterWalker = observer(
    forwardRef<IGWHandler, IVizAppProps & IFilterWalkerProps & (ILocalComputationProps | IRemoteComputationProps)>((props, ref) => {
        const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

        const handleMount = (shadowRoot: ShadowRoot) => {
            setShadowRoot(shadowRoot);
        };
        const handleUnmount = () => {
            setShadowRoot(null);
        };

        return (
            <AppRoot ref={ref as ForwardedRef<IGWHandlerInsider>}>
                <ShadowDom onMount={handleMount} onUnmount={handleUnmount}>
                    <DOMProvider value={{ head: shadowRoot ?? document.head, body: shadowRoot ?? document.body }}>
                        <FilterAppWithContext {...props} />
                    </DOMProvider>
                </ShadowDom>
            </AppRoot>
        );
    })
) as {
    (p: ILocalVizAppProps & IFilterWalkerProps): JSX.Element;
    (p: IRemoteVizAppProps & IFilterWalkerProps): JSX.Element;
};

export type ILocalTableProps = ITableProps & ILocalComputationProps & React.RefAttributes<IGWHandler>;
export type IRemoteTableProps = ITableProps & IRemoteComputationProps & React.RefAttributes<IGWHandler>;

export const TableWalker = observer(
    forwardRef<IGWHandler, ITableProps & IComputationProps>((props, ref) => {
        const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

        const handleMount = (shadowRoot: ShadowRoot) => {
            setShadowRoot(shadowRoot);
        };
        const handleUnmount = () => {
            setShadowRoot(null);
        };

        return (
            <AppRoot ref={ref as ForwardedRef<IGWHandlerInsider>}>
                <ShadowDom onMount={handleMount} onUnmount={handleUnmount}>
                    <DOMProvider value={{ head: shadowRoot ?? document.head, body: shadowRoot ?? document.body }}>
                        <TableAppWithContext {...props} />
                    </DOMProvider>
                </ShadowDom>
            </AppRoot>
        );
    })
) as {
    (p: ILocalTableProps): JSX.Element;
    (p: IRemoteTableProps): JSX.Element;
};

export { default as PureRenderer } from './renderer/pureRenderer';
export type { ILocalPureRendererProps, IRemotePureRendererProps } from './renderer/pureRenderer';
export { embedGraphicWalker } from './vanilla';
export type { IGWProps, ITableProps, IVizAppProps, IDataSourceProvider, IMutField, IRow, IDataSourceListener, IChart, IChartForExport, IVisSpecForExport };
export { VizSpecStore } from './store/visualSpecStore';
export { ISegmentKey, ColorSchemes, IDataSourceEventType } from './interfaces';
export { resolveChart, convertChart } from './models/visSpecHistory';
export { getGlobalConfig } from './config';
export { DataSourceSegmentComponent } from './dataSource';
export * from './models/visSpecHistory';
export * from './dataSourceProvider';
export { getComputation } from './computation/clientComputation';
export { addFilterForQuery, chartToWorkflow } from './utils/workflow';
export * from './components/filterWalker';
