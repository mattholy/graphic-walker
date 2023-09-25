import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "../../store";
import type { IActionMenuItem } from "../../components/actionMenu/list";
import { COUNT_FIELD_ID, DATE_TIME_DRILL_LEVELS, DATE_TIME_FEATURE_LEVELS } from "../../constants";
import { useComputationFunc } from "../../renderer/hooks";
import { getSample } from "../../computation/serverComputation";
import { getTimeFormat } from "../../lib/inferMeta";


const keepTrue = <T extends string | number | object | Function | symbol>(array: (T | 0 | null | false | undefined | void)[]): T[] => {
    return array.filter(Boolean) as T[];
};

export const useMenuActions = (channel: "dimensions" | "measures"): IActionMenuItem[][] => {
    const { vizStore, commonStore } = useGlobalStore();
    const fields = vizStore.draggableFieldState[channel];
    const { t } = useTranslation('translation', { keyPrefix: "field_menu" });
    const computation = useComputationFunc();

    return useMemo<IActionMenuItem[][]>(() => {
        return fields.map((f, index) => {
            const isDateTimeDrilled = f.expression?.op === 'dateTimeDrill';

            return keepTrue<IActionMenuItem>([
                channel === 'dimensions' && {
                    label: t('to_mea'),
                    onPress() {
                        vizStore.moveField("dimensions", index, "measures", vizStore.draggableFieldState.measures.length);
                    },
                },
                channel === 'measures' && {
                    label: t('to_dim'),
                    disabled: f.fid === COUNT_FIELD_ID,
                    onPress() {
                        vizStore.moveField("measures", index, "dimensions", vizStore.draggableFieldState.dimensions.length);
                    },
                },
                {
                    label: t('new_calc'),
                    disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                    children: [
                        {
                            label: t('bin'),
                            onPress() {
                                vizStore.createBinField(channel, index, "bin");
                            },
                        },
                        {
                            label: t('binCount'),
                            disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                            onPress() {
                                vizStore.createBinField(channel, index, "binCount");
                            },
                        },
                        {
                            label: t('log', {base: 10}),
                            disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                            onPress() {
                                vizStore.createLogField(channel, index, "log", 10);
                            },
                        },
                        {
                            label: t('log', {base: 2}),
                            disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                            onPress() {
                                vizStore.createLogField(channel, index, "log", 2);
                            },
                        },
                        {
                            label:t('binCustom'),
                            disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                            onPress(){
                                commonStore.setShowBinSettingPanel(true);
                                commonStore.setCreateField({channel:channel,index:index});
                            }
                        },
                        {
                            label:t('logCustom'),
                            disabled: f.semanticType === 'nominal' || f.semanticType === 'ordinal',
                            onPress(){
                                commonStore.setShowLogSettingPanel(true);
                                commonStore.setCreateField({channel:channel,index:index})
                            }
                        },
                        
                    ],
                },
                {
                    label: t('semantic_type.name'),
                    children: (["nominal", "ordinal", "quantitative", "temporal"] as const).map(x => ({
                        label: t(`semantic_type.types.${x}`),
                        disabled: f.semanticType === x,
                        onPress() {
                            const originChannel = f.analyticType === 'dimension' ? 'dimensions' : 'measures';
                            vizStore.changeSemanticType(originChannel, index, x);
                        },
                    }))
                },
                (f.semanticType === 'temporal' || isDateTimeDrilled) && {
                    label: t('drill.name'),
                    children: DATE_TIME_DRILL_LEVELS.map(level => ({
                        label: t(`drill.levels.${level}`),
                        disabled: isDateTimeDrilled && f.expression.params.find(p => p.type === 'value')?.value === level,
                        onPress() {
                            const originField = (isDateTimeDrilled ? vizStore.allFields.find(field => field.fid === f.expression?.params.find(p => p.type === 'field')?.value) : null) ?? f;
                            const originChannel = originField.analyticType === 'dimension' ? 'dimensions' : 'measures';
                            const originIndex = vizStore.allFields.findIndex(x => x.fid === originField.fid);
                            getSample(computation, originField.fid).then(getTimeFormat).then(format => vizStore.createDateTimeDrilledField(originChannel, originIndex,  'dateTimeDrill',level, `${t(`drill.levels.${level}`)} (${originField.name || originField.fid})`, format));
                        },
                    })),
                },
                (f.semanticType === 'temporal' || isDateTimeDrilled) && {
                    label: t('drill.feature_name'),
                    children: DATE_TIME_FEATURE_LEVELS.map(level => ({
                        label: t(`drill.levels.${level}`),
                        disabled: isDateTimeDrilled && f.expression.params.find(p => p.type === 'value')?.value === level,
                        onPress() {
                            const originField = (isDateTimeDrilled ? vizStore.allFields.find(field => field.fid === f.expression?.params.find(p => p.type === 'field')?.value) : null) ?? f;
                            const originChannel = originField.analyticType === 'dimension' ? 'dimensions' : 'measures';
                            const originIndex = vizStore.allFields.findIndex(x => x.fid === originField.fid);
                            getSample(computation, originField.fid).then(getTimeFormat).then(format => vizStore.createDateTimeDrilledField(originChannel, originIndex, 'dateTimeFeature', level,`${t(`drill.levels.${level}`)} [${originField.name || originField.fid}]`, format));
                        },
                    })),
                },

            ]);
        });
    }, [channel, fields, vizStore, t, computation]);
};
