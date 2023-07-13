import React, { createContext, forwardRef, useImperativeHandle, type ForwardedRef, useContext } from "react";
import type { IChartExportResult, IGWHandler } from "../interfaces";

const AppRootContext = createContext<ForwardedRef<IGWHandler>>(null!);

export const useAppRootContext = () => {
    return useContext(AppRootContext);
};

const AppRoot = forwardRef<IGWHandler, { children: any }>(({ children }, ref) => {
    useImperativeHandle(ref, () => {
        return {
            chartCount: 1,
            chartIndex: 0,
            openChart() {},
            exportChart: (async (mode: IChartExportResult['mode']) => {
                return {
                    mode,
                    title: '',
                    nCols: 0,
                    nRows: 0,
                    charts: [],
                };
            }) as IGWHandler['exportChart'],
        };
    }, []);

    return (
        <AppRootContext.Provider value={ref}>
            {children}
        </AppRootContext.Provider>
    );
});

export default AppRoot;