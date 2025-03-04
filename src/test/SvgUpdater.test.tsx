import { FlowValueMapping, PanelConfigCellFlowAnimation } from 'components/Config';
import { getFlowAnimationState, valueMapping } from 'components/SvgUpdater'

test('coherent_min_max', () => {
  let fad: PanelConfigCellFlowAnimation = {
    dataRef: undefined,
    datapoint:undefined,
    thresholdOffValue: 10,
    thresholdLwrValue: 100,
    thresholdLwrDurationSecs: 10,
    thresholdUprValue: 200,
    thresholdUprDurationSecs: 20,
    unidirectional: false,
    dataCoherent: false,
  };
  
  let animState = getFlowAnimationState(fad, 150);
  expect(animState.durationSecs).toEqual(0);

  fad.dataCoherent = true;
  animState = getFlowAnimationState(fad, -250);
  expect(animState.durationSecs).toEqual(20);
  animState = getFlowAnimationState(fad, -200);
  expect(animState.durationSecs).toEqual(20);
  animState = getFlowAnimationState(fad, -100);
  expect(animState.durationSecs).toEqual(10);
  animState = getFlowAnimationState(fad, -50);
  expect(animState.durationSecs).toEqual(10);
  animState = getFlowAnimationState(fad, -10);
  expect(animState.durationSecs).toEqual(0);

  animState = getFlowAnimationState(fad, 0);
  expect(animState.durationSecs).toEqual(0);

  animState = getFlowAnimationState(fad, 10);
  expect(animState.durationSecs).toEqual(0);
  animState = getFlowAnimationState(fad, 50);
  expect(animState.durationSecs).toEqual(10);
  animState = getFlowAnimationState(fad, 100);
  expect(animState.durationSecs).toEqual(10);
  animState = getFlowAnimationState(fad, 200);
  expect(animState.durationSecs).toEqual(20);
  animState = getFlowAnimationState(fad, 250);
  expect(animState.durationSecs).toEqual(20);
});

test('interpolate', () => {
  let fad: PanelConfigCellFlowAnimation = {
    dataRef: undefined,
    datapoint:undefined,
    thresholdOffValue: 10,
    thresholdLwrValue: 100,
    thresholdLwrDurationSecs: 20,
    thresholdUprValue: 200,
    thresholdUprDurationSecs: 10,
    unidirectional: false,
    dataCoherent: true,
  };
  
  let animState = getFlowAnimationState(fad, 125);
  expect(animState.durationSecs).toEqual(17.5);
  animState = getFlowAnimationState(fad, 150);
  expect(animState.durationSecs).toEqual(15);
  animState = getFlowAnimationState(fad, 175);
  expect(animState.durationSecs).toEqual(12.5);
});

test('inverted', () => {
  let fad: PanelConfigCellFlowAnimation = {
    dataRef: undefined,
    datapoint:undefined,
    thresholdOffValue: 10,
    thresholdLwrValue: 100,
    thresholdLwrDurationSecs: 10,
    thresholdUprValue: 200,
    thresholdUprDurationSecs: 20,
    unidirectional: false,
    dataCoherent: true,
  };
  
  let animState = getFlowAnimationState(fad, 125);
  expect(animState.durationSecs).toEqual(12.5);
  animState = getFlowAnimationState(fad, 150);
  expect(animState.durationSecs).toEqual(15);
  animState = getFlowAnimationState(fad, 175);
  expect(animState.durationSecs).toEqual(17.5);
});

test('unidirectional', () => {
  let fad: PanelConfigCellFlowAnimation = {
    dataRef: undefined,
    datapoint:undefined,
    thresholdOffValue: 10,
    thresholdLwrValue: 100,
    thresholdLwrDurationSecs: 20,
    thresholdUprValue: 200,
    thresholdUprDurationSecs: 10,
    unidirectional: false,
    dataCoherent: true,
  };
  
  let animState = getFlowAnimationState(fad, 100);
  expect(animState.direction).toEqual('normal');
  animState = getFlowAnimationState(fad, -100);
  expect(animState.direction).toEqual('reverse');

  fad.unidirectional = true;

  animState = getFlowAnimationState(fad, 100);
  expect(animState.direction).toEqual('normal');
  animState = getFlowAnimationState(fad, -100);
  expect(animState.direction).toEqual('normal');
});

test('zero', () => {
  let fad: PanelConfigCellFlowAnimation = {
    dataRef: undefined,
    datapoint:undefined,
    thresholdOffValue: undefined,
    thresholdLwrValue: 100,
    thresholdLwrDurationSecs: 20,
    thresholdUprValue: 200,
    thresholdUprDurationSecs: 10,
    unidirectional: false,
    dataCoherent: true,
  };
  
  let animState = getFlowAnimationState(fad, -5);
  expect(animState.durationSecs).toEqual(20);
  animState = getFlowAnimationState(fad, 0);
  expect(animState.durationSecs).toEqual(20);
  animState = getFlowAnimationState(fad, 5);
  expect(animState.durationSecs).toEqual(20);

  fad.thresholdOffValue = 5;

  animState = getFlowAnimationState(fad, -5);
  expect(animState.durationSecs).toEqual(0);
  animState = getFlowAnimationState(fad, 0);
  expect(animState.durationSecs).toEqual(0);
  animState = getFlowAnimationState(fad, 5);
  expect(animState.durationSecs).toEqual(0);
});

test('valuemapping', () => {
  let fvm: FlowValueMapping[] = [
    {valid: true, value: -3, valueMin: undefined, valueMax: undefined, text: 'val_-3'},
    {valid: true, value: 0, valueMin: undefined, valueMax: undefined, text: 'val_0'},
    {valid: true, value: 3, valueMin: undefined, valueMax: undefined, text: 'val_3'},
    {valid: true, value: undefined, valueMin: 10, valueMax: 20, text: 'hello1'},
    {valid: true, value: undefined, valueMin: 21, valueMax: 30, text: 'hello2'},
    {valid: true, value: undefined, valueMin: 1000, valueMax: undefined, text: 'high'},
    {valid: true, value: undefined, valueMin: undefined, valueMax: -1000, text: 'low'},
  ];
  expect(valueMapping(fvm, -4)).toEqual(null);
  expect(valueMapping(fvm, -3)).toEqual('val_-3');
  expect(valueMapping(fvm, 0)).toEqual('val_0');
  expect(valueMapping(fvm, 3)).toEqual('val_3');
  expect(valueMapping(fvm, null)).toEqual(null);
  expect(valueMapping(fvm, -1100)).toEqual('low');
  expect(valueMapping(fvm, 1100)).toEqual('high');
});

test('valuemappingnocriteria', () => {
  let fvm: FlowValueMapping[] = [
    {valid: true, value:  undefined, valueMin: undefined, valueMax: undefined, text: 'custom'},
  ];
  expect(valueMapping(fvm, -4)).toEqual('custom');
  expect(valueMapping(fvm, 0)).toEqual('custom');
  expect(valueMapping(fvm, 4)).toEqual('custom');
});
