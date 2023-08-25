import { observer } from 'mobx-react-lite';
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '../../store';
import { NonPositionChannelConfigList, PositionChannelConfigList } from '../../config';
import { TwitterPicker, BlockPicker, SketchPicker } from 'react-color';
import Modal from '../modal';
import { IVisualConfig } from '../../interfaces';
import PrimaryButton from '../button/primary';
import DefaultButton from '../button/default';
import { useTranslation } from 'react-i18next';
import Toggle from '../toggle';
import { runInAction, toJS } from 'mobx';
import { ColorSchemes } from './colorScheme';

const VisualConfigPanel: React.FC = (props) => {
    const { commonStore, vizStore } = useGlobalStore();
    const { showVisualConfigPanel } = commonStore;
    const { visualConfig } = vizStore;
    const {
        coordSystem,
        geoms: [markType],
    } = visualConfig;
    const isChoropleth = coordSystem === 'geographic' && markType === 'choropleth';
    const { t } = useTranslation();
    const formatConfigList: (keyof IVisualConfig['format'])[] = ['numberFormat', 'timeFormat', 'normalizedNumberFormat'];
    const [format, setFormat] = useState<IVisualConfig['format']>({
        numberFormat: visualConfig.format.numberFormat,
        timeFormat: visualConfig.format.timeFormat,
        normalizedNumberFormat: visualConfig.format.normalizedNumberFormat,
    });
    const [resolve, setResolve] = useState<IVisualConfig['resolve']>({
        x: visualConfig.resolve.x,
        y: visualConfig.resolve.y,
        color: visualConfig.resolve.color,
        opacity: visualConfig.resolve.opacity,
        shape: visualConfig.resolve.shape,
        size: visualConfig.resolve.size,
    });
    const [zeroScale, setZeroScale] = useState<boolean>(visualConfig.zeroScale);
    const [scaleIncludeUnmatchedChoropleth, setScaleIncludeUnmatchedChoropleth] = useState<boolean>(visualConfig.scaleIncludeUnmatchedChoropleth ?? false);
    const [background, setBackground] = useState<string | undefined>(visualConfig.background);
    const [defaultColor, setDefaultColor] = useState({ r: 91, g: 143, b: 249, a: 1 });
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const [displaySchemePicker, setDisplaySchemePicker] = useState(false);
    const selectColor = useRef('rgb(91, 143, 249)');
  
    const getRGBA = (rgba) => {
        console.log(rgba)
        let arr = rgba.match(/\d+/g);
        console.log("arr",arr)
        return {
            r: arr[0],
            g: arr[1],
            b: arr[2],
            a: arr[3]
        }
    };

    useEffect(() => {
        setZeroScale(visualConfig.zeroScale);
        setBackground(visualConfig.background);
        setResolve(toJS(visualConfig.resolve));
        setDefaultColor(getRGBA(visualConfig.primaryColor))
        setScaleIncludeUnmatchedChoropleth(visualConfig.scaleIncludeUnmatchedChoropleth ?? false);
        setFormat({
            numberFormat: visualConfig.format.numberFormat,
            timeFormat: visualConfig.format.timeFormat,
            normalizedNumberFormat: visualConfig.format.normalizedNumberFormat,
        });
    }, [showVisualConfigPanel]);

    return (
        <Modal
            show={showVisualConfigPanel}
            onClose={() => {
                commonStore.setShowVisualConfigPanel(false);
            }}
        >
            <div
                onClick={() => {
                    setDisplayColorPicker(false);
                }}
            >
                <div className="mb-2">
                    <h2 className="text-lg mb-4">Scheme</h2>
                    <div className="flex">
                        <p className="w-28">Primary Color</p>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                        >
                            <div
                                className="w-8 h-5 border-2"
                                style={{ backgroundColor: `rgba(${defaultColor.r},${defaultColor.g},${defaultColor.b},${defaultColor.a})` }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setDisplayColorPicker(true);
                                }}
                            ></div>
                            <div className="absolute left-32 top-22 index-40">
                                {displayColorPicker && (
                                    <SketchPicker
                                        presetColors={[
                                            '#5B8FF9',
                                            '#FF6900',
                                            '#FCB900',
                                            '#7BDCB5',
                                            '#00D084',
                                            '#8ED1FC',
                                            '#0693E3',
                                            '#ABB8C3',
                                            '#EB144C',
                                            '#F78DA7',
                                            '#9900EF',
                                        ]}
                                        color={defaultColor}
                                        onChange={(color, event) => {
                                            console.log(color.hex);
                                            console.log('event', event);
                                            setDefaultColor(color.rgb);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* {ColorSchemes.map((scheme) => {
                        return (
                            <div key={scheme.name} className="flex justify-start items-center">
                                <div className="font-light mx-2 w-24 ">{scheme.name}</div>
                                {scheme.value.map((c, index) => {
                                    return <div key={index} className="w-4 h-4" style={{ backgroundColor: `${c}` }}></div>;
                                })}
                            </div>
                        );
                    })} */}
                </div>
                <div>
                    <h2 className="text-lg mb-4">{t('config.format')}</h2>
                    <p className="text-xs">
                        {t(`config.formatGuidesDocs`)}:{' '}
                        <a target="_blank" className="underline text-blue-500" href="https://github.com/d3/d3-format#locale_format">
                            {t(`config.readHere`)}
                        </a>
                    </p>
                    {formatConfigList.map((fc) => (
                        <div className="my-2" key={fc}>
                            <label className="block text-xs font-medium leading-6">{t(`config.${fc}`)}</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    className="block w-full text-gray-700 dark:text-gray-200 rounded-md border-0 py-1 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 "
                                    value={format[fc] ?? ''}
                                    onChange={(e) => {
                                        setFormat((f) => ({
                                            ...f,
                                            [fc]: e.target.value,
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    <h2 className="text-lg">{t('config.background')}</h2>
                    <div className="my-2">
                        <label className="block text-xs font-medium leading-6">{t(`config.color`)}</label>
                        <div className="mt-1">
                            <input
                                type="text"
                                className="block w-full text-gray-700 dark:text-gray-200 rounded-md border-0 py-1 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 "
                                value={background ?? ''}
                                onChange={(e) => {
                                    setBackground(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                    <h2 className="text-lg">{t('config.independence')}</h2>
                    <div className="my-2">
                        <div className="flex space-x-6">
                            {PositionChannelConfigList.map((pc) => (
                                <Toggle
                                    label={t(`config.${pc}`)}
                                    key={pc}
                                    enabled={resolve[pc] ?? false}
                                    onChange={(e) => {
                                        setResolve((r) => ({
                                            ...r,
                                            [pc]: e,
                                        }));
                                    }}
                                />
                            ))}
                            {NonPositionChannelConfigList.map((npc) => (
                                <Toggle
                                    label={t(`constant.draggable_key.${npc}`)}
                                    key={npc}
                                    enabled={resolve[npc] ?? false}
                                    onChange={(e) => {
                                        setResolve((r) => ({
                                            ...r,
                                            [npc]: e,
                                        }));
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <h2 className="text-lg">{t('config.zeroScale')}</h2>
                    <div className="my-2">
                        <Toggle
                            label={t(`config.zeroScale`)}
                            enabled={zeroScale}
                            onChange={(en) => {
                                setZeroScale(en);
                            }}
                        />
                    </div>
                    {isChoropleth && (
                        <div className="my-2">
                            <Toggle
                                label="include unmatched choropleth in scale"
                                enabled={scaleIncludeUnmatchedChoropleth}
                                onChange={(en) => {
                                    setScaleIncludeUnmatchedChoropleth(en);
                                }}
                            />
                        </div>
                    )}
                    <div className="mt-4">
                        <PrimaryButton
                            text={t('actions.confirm')}
                            className="mr-2"
                            onClick={() => {
                                runInAction(() => {
                                    vizStore.setVisualConfig('format', format);
                                    vizStore.setVisualConfig('zeroScale', zeroScale);
                                    vizStore.setVisualConfig('scaleIncludeUnmatchedChoropleth', scaleIncludeUnmatchedChoropleth);
                                    vizStore.setVisualConfig('background', background);
                                    vizStore.setVisualConfig('resolve', resolve);
                                    vizStore.setVisualConfig('primaryColor',`rgba(${defaultColor.r},${defaultColor.g},${defaultColor.b},${defaultColor.a})`);
                                    commonStore.setShowVisualConfigPanel(false);

                                });
                            }}
                        />
                        <DefaultButton
                            text={t('actions.cancel')}
                            className="mr-2"
                            onClick={() => {
                                commonStore.setShowVisualConfigPanel(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default observer(VisualConfigPanel);
