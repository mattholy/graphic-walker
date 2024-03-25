import { BarsArrowDownIcon, BarsArrowUpIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React, { useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { DraggableProvided } from '@kanaries/react-beautiful-dnd';
import { COUNT_FIELD_ID, DEFAULT_DATASET, MEA_KEY_ID, MEA_VAL_ID } from '../../constants';
import { IAggregator, IDraggableViewStateKey } from '../../interfaces';
import { DatasetNamesContext, useVizStore } from '../../store';
import { Pill } from '../components';
import { GLOBAL_CONFIG } from '../../config';
import DropdownContext from '../../components/dropdownContext';
import SelectContext, { type ISelectContextOption } from '../../components/selectContext';
import { refMapper } from '../fieldsContext';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/tooltip';
import { EditNamePopover } from '../renamePanel';

interface PillProps {
    provided: DraggableProvided;
    fIndex: number;
    dkey: IDraggableViewStateKey;
}
const OBPill: React.FC<PillProps> = (props) => {
    const { provided, dkey, fIndex } = props;
    const vizStore = useVizStore();
    const { config, foldOptions, datasetJoinPaths } = vizStore;
    const field = vizStore.allEncodings[dkey.id][fIndex];
    const { t } = useTranslation('translation', { keyPrefix: 'constant.aggregator' });

    const aggregationOptions = useMemo(() => {
        return GLOBAL_CONFIG.AGGREGATOR_LIST.map((op) => ({
            value: op,
            label: t(op),
        }));
    }, []);

    const folds = field.fid === MEA_KEY_ID ? config.folds ?? [] : null;

    const datasetNames = useContext(DatasetNamesContext);
    const hasMultiJoins = datasetJoinPaths[field.dataset ?? DEFAULT_DATASET]?.length > 1;

    return (
        <Pill
            ref={refMapper(provided.innerRef)}
            colType={field.analyticType === 'dimension' ? 'discrete' : 'continuous'}
            className={`${field.aggName === 'expr' && !config.defaultAggregated ? '!opacity-50 touch-none' : 'touch-none'}`}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
        >
            {folds && (
                <SelectContext
                    options={foldOptions}
                    selectedKeys={folds}
                    onSelect={(keys) => {
                        vizStore.setVisualConfig('folds', keys);
                    }}
                >
                    <span className="flex-1 truncate">{field.name}</span>
                </SelectContext>
            )}
            {!folds && (
                <span className="flex-1 truncate">
                    {field.dataset ? `${datasetNames?.[field.dataset] ?? field.dataset}.` : ''}
                    {field.name}
                </span>
            )}
            {hasMultiJoins && field.joinPath && (
                <EditNamePopover
                    defaultValue={field.name}
                    onSubmit={(name) => vizStore.editFieldName(props.dkey.id, props.fIndex, name)}
                    desc={
                        <div className="text-xs">
                            This Field is Joined with below:
                            <pre className="my-1">{vizStore.renderJoinPath(field.joinPath ?? [], datasetNames)}</pre>
                        </div>
                    }
                >
                    <PencilSquareIcon className="w-3 h-3 ml-1" />
                </EditNamePopover>
            )}
            &nbsp;
            {field.analyticType === 'measure' && field.fid !== COUNT_FIELD_ID && config.defaultAggregated && field.aggName !== 'expr' && (
                <DropdownContext
                    options={aggregationOptions}
                    onSelect={(value) => {
                        vizStore.setFieldAggregator(dkey.id, fIndex, value as IAggregator);
                    }}
                >
                    <span className="bg-transparent float-right focus:outline-none focus: dark:focus: flex items-center ml-2">
                        {field.aggName || ''}
                        <ChevronUpDownIcon className="w-3" />
                    </span>
                </DropdownContext>
            )}
            {field.analyticType === 'dimension' && field.sort === 'ascending' && (
                <BarsArrowUpIcon className="float-right w-3" role="status" aria-label="Sorted in ascending order" />
            )}
            {field.analyticType === 'dimension' && field.sort === 'descending' && (
                <BarsArrowDownIcon className="float-right w-3" role="status" aria-label="Sorted in descending order" />
            )}
        </Pill>
    );
};

export default observer(OBPill);
