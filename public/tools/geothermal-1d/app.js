"use strict";

(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const A_MIN = 0;
  const A_MAX = 8;
  const K_MIN = 0.5;
  const K_MAX = 8;
  const MAX_LAYERS = 12;

  const elements = {
    modelChart: document.getElementById("modelChart"),
    geothermChart: document.getElementById("geothermChart"),
    surfaceTemperature: document.getElementById("surfaceTemperatureInput"),
    basalHeatFlow: document.getElementById("basalHeatFlowInput"),
    totalDepth: document.getElementById("totalDepthInput"),
    cellCount: document.getElementById("cellCountInput"),
    layerCount: document.getElementById("layerCountInput"),
    selectedLayerLabel: document.getElementById("selectedLayerLabel"),
    selectedA: document.getElementById("selectedAInput"),
    selectedK: document.getElementById("selectedKInput"),
    split: document.getElementById("splitButton"),
    merge: document.getElementById("mergeButton"),
    reset: document.getElementById("resetButton"),
    downloadCsv: document.getElementById("downloadCsvButton"),
    downloadModel: document.getElementById("downloadModelButton"),
    loadModel: document.getElementById("loadModelInput"),
    tableBody: document.getElementById("layerTableBody"),
    surfaceHeatFlow: document.getElementById("surfaceHeatFlowMetric"),
    bottomTemperature: document.getElementById("bottomTemperatureMetric"),
    solutionDifference: document.getElementById("solutionDifferenceMetric"),
    thermalResistance: document.getElementById("thermalResistanceMetric"),
    methodButton: document.getElementById("methodButton"),
    methodDialog: document.getElementById("methodDialog"),
    methodDialogClose: document.getElementById("methodDialogClose")
  };

  const defaultModel = () => ({
    surfaceTemperatureC: 15,
    basalHeatFlowMilliWm2: 25,
    totalDepthKm: 40,
    cellCount: 400,
    selectedLayer: 0,
    layers: [
      { bottomKm: 5, heatGenerationMicroWm3: 2.5, conductivityWmK: 2.5 },
      { bottomKm: 15, heatGenerationMicroWm3: 1.2, conductivityWmK: 2.7 },
      { bottomKm: 30, heatGenerationMicroWm3: 0.3, conductivityWmK: 3.0 },
      { bottomKm: 40, heatGenerationMicroWm3: 0.05, conductivityWmK: 3.3 }
    ]
  });

  let state = defaultModel();
  let currentSolution = null;
  let dragState = null;
  let frameRequest = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finiteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function layerTopKm(index) {
    return index === 0 ? 0 : state.layers[index - 1].bottomKm;
  }

  function minimumLayerThicknessKm() {
    return Math.min(
      Math.max(0.02, state.totalDepthKm * 0.005),
      state.totalDepthKm / (MAX_LAYERS * 1.2)
    );
  }

  function normalizeState() {
    state.totalDepthKm = clamp(finiteNumber(state.totalDepthKm, 40), 1, 100);
    state.surfaceTemperatureC = clamp(finiteNumber(state.surfaceTemperatureC, 15), -100, 500);
    state.basalHeatFlowMilliWm2 = clamp(finiteNumber(state.basalHeatFlowMilliWm2, 25), 0, 500);
    state.cellCount = Math.round(clamp(finiteNumber(state.cellCount, 400), 50, 2000));
    if (!Array.isArray(state.layers) || state.layers.length === 0) state.layers = defaultModel().layers;
    state.layers = state.layers.slice(0, MAX_LAYERS);

    const minimumThickness = Math.min(minimumLayerThicknessKm(), state.totalDepthKm / state.layers.length * 0.45);
    state.layers.forEach((layer, index) => {
      layer.heatGenerationMicroWm3 = clamp(finiteNumber(layer.heatGenerationMicroWm3, 1), A_MIN, A_MAX);
      layer.conductivityWmK = clamp(finiteNumber(layer.conductivityWmK, 2.5), K_MIN, K_MAX);
      if (index === state.layers.length - 1) {
        layer.bottomKm = state.totalDepthKm;
      } else {
        const lower = (index === 0 ? 0 : state.layers[index - 1].bottomKm) + minimumThickness;
        const upper = state.totalDepthKm - minimumThickness * (state.layers.length - index - 1);
        layer.bottomKm = clamp(finiteNumber(layer.bottomKm, lower), lower, upper);
      }
    });
    state.selectedLayer = clamp(Math.round(finiteNumber(state.selectedLayer, 0)), 0, state.layers.length - 1);
  }

  function layerIndexAtDepth(depthKm) {
    for (let index = 0; index < state.layers.length; index += 1) {
      if (depthKm <= state.layers[index].bottomKm + 1e-10) return index;
    }
    return state.layers.length - 1;
  }

  function calculateAnalyticalSolution() {
    const basalHeatFlow = state.basalHeatFlowMilliWm2 * 1e-3;
    let surfaceHeatFlow = basalHeatFlow;
    let thermalResistance = 0;

    state.layers.forEach((layer, index) => {
      const thicknessM = (layer.bottomKm - layerTopKm(index)) * 1000;
      surfaceHeatFlow += layer.heatGenerationMicroWm3 * 1e-6 * thicknessM;
      thermalResistance += thicknessM / layer.conductivityWmK;
    });

    const points = [{ depthKm: 0, temperatureC: state.surfaceTemperatureC }];
    const summaries = [];
    let topTemperature = state.surfaceTemperatureC;
    let topHeatFlow = surfaceHeatFlow;

    state.layers.forEach((layer, index) => {
      const topKm = layerTopKm(index);
      const thicknessKm = layer.bottomKm - topKm;
      const thicknessM = thicknessKm * 1000;
      const heatGeneration = layer.heatGenerationMicroWm3 * 1e-6;
      const conductivity = layer.conductivityWmK;
      const sampleCount = Math.max(12, Math.round(90 * thicknessKm / state.totalDepthKm));

      summaries.push({
        layer: index + 1,
        topKm,
        bottomKm: layer.bottomKm,
        thicknessKm,
        heatGenerationMicroWm3: layer.heatGenerationMicroWm3,
        conductivityWmK: layer.conductivityWmK,
        topHeatFlowMilliWm2: topHeatFlow * 1000,
        topTemperatureC: topTemperature
      });

      for (let sample = 1; sample <= sampleCount; sample += 1) {
        const localDepthM = thicknessM * sample / sampleCount;
        const temperature = topTemperature + (topHeatFlow * localDepthM - 0.5 * heatGeneration * localDepthM * localDepthM) / conductivity;
        points.push({ depthKm: topKm + thicknessKm * sample / sampleCount, temperatureC: temperature });
      }

      topTemperature += (topHeatFlow * thicknessM - 0.5 * heatGeneration * thicknessM * thicknessM) / conductivity;
      topHeatFlow -= heatGeneration * thicknessM;
    });

    return {
      points,
      summaries,
      surfaceHeatFlowMilliWm2: surfaceHeatFlow * 1000,
      bottomTemperatureC: topTemperature,
      thermalResistanceM2KW: thermalResistance
    };
  }

  function solveTridiagonal(lower, diagonal, upper, rightHandSide) {
    const count = diagonal.length;
    const modifiedUpper = new Float64Array(count);
    const modifiedRight = new Float64Array(count);
    modifiedUpper[0] = upper[0] / diagonal[0];
    modifiedRight[0] = rightHandSide[0] / diagonal[0];

    for (let index = 1; index < count; index += 1) {
      const denominator = diagonal[index] - lower[index] * modifiedUpper[index - 1];
      modifiedUpper[index] = index < count - 1 ? upper[index] / denominator : 0;
      modifiedRight[index] = (rightHandSide[index] - lower[index] * modifiedRight[index - 1]) / denominator;
    }

    const solution = new Float64Array(count);
    solution[count - 1] = modifiedRight[count - 1];
    for (let index = count - 2; index >= 0; index -= 1) {
      solution[index] = modifiedRight[index] - modifiedUpper[index] * solution[index + 1];
    }
    return solution;
  }

  function calculateFiniteVolumeSolution() {
    const cellCount = state.cellCount;
    const totalDepthM = state.totalDepthKm * 1000;
    const cellThicknessM = totalDepthM / cellCount;
    const heatGeneration = new Float64Array(cellCount);
    const conductivity = new Float64Array(cellCount);

    for (let index = 0; index < cellCount; index += 1) {
      const centerDepthKm = (index + 0.5) * cellThicknessM / 1000;
      const layer = state.layers[layerIndexAtDepth(centerDepthKm)];
      heatGeneration[index] = layer.heatGenerationMicroWm3 * 1e-6;
      conductivity[index] = layer.conductivityWmK;
    }

    const lower = new Float64Array(cellCount);
    const diagonal = new Float64Array(cellCount);
    const upper = new Float64Array(cellCount);
    const rightHandSide = new Float64Array(cellCount);
    const topBoundaryConductance = 2 * conductivity[0] / cellThicknessM;

    for (let index = 0; index < cellCount; index += 1) {
      const source = heatGeneration[index] * cellThicknessM;
      if (index === 0) {
        const eastConductance = 2 / (1 / conductivity[index] + 1 / conductivity[index + 1]) / cellThicknessM;
        diagonal[index] = topBoundaryConductance + eastConductance;
        upper[index] = -eastConductance;
        rightHandSide[index] = source + topBoundaryConductance * state.surfaceTemperatureC;
      } else if (index === cellCount - 1) {
        const westConductance = 2 / (1 / conductivity[index - 1] + 1 / conductivity[index]) / cellThicknessM;
        lower[index] = -westConductance;
        diagonal[index] = westConductance;
        rightHandSide[index] = source + state.basalHeatFlowMilliWm2 * 1e-3;
      } else {
        const westConductance = 2 / (1 / conductivity[index - 1] + 1 / conductivity[index]) / cellThicknessM;
        const eastConductance = 2 / (1 / conductivity[index] + 1 / conductivity[index + 1]) / cellThicknessM;
        lower[index] = -westConductance;
        diagonal[index] = westConductance + eastConductance;
        upper[index] = -eastConductance;
        rightHandSide[index] = source;
      }
    }

    const temperatures = solveTridiagonal(lower, diagonal, upper, rightHandSide);
    const points = [{ depthKm: 0, temperatureC: state.surfaceTemperatureC }];
    for (let index = 0; index < cellCount; index += 1) {
      points.push({ depthKm: (index + 0.5) * cellThicknessM / 1000, temperatureC: temperatures[index] });
    }

    const lastIndex = cellCount - 1;
    const bottomHalfThickness = cellThicknessM / 2;
    const bottomTemperature = temperatures[lastIndex]
      + (state.basalHeatFlowMilliWm2 * 1e-3 * bottomHalfThickness
      + 0.5 * heatGeneration[lastIndex] * bottomHalfThickness * bottomHalfThickness)
      / conductivity[lastIndex];
    points.push({ depthKm: state.totalDepthKm, temperatureC: bottomTemperature });
    return { points, bottomTemperatureC: bottomTemperature };
  }

  function analyticalTemperatureAtDepth(depthKm, analytical) {
    const z = clamp(depthKm, 0, state.totalDepthKm);
    const layerIndex = layerIndexAtDepth(z);
    const summary = analytical.summaries[layerIndex];
    const localDepthM = (z - summary.topKm) * 1000;
    const layer = state.layers[layerIndex];
    const heatGeneration = layer.heatGenerationMicroWm3 * 1e-6;
    const topHeatFlow = summary.topHeatFlowMilliWm2 * 1e-3;
    return summary.topTemperatureC + (topHeatFlow * localDepthM - 0.5 * heatGeneration * localDepthM * localDepthM) / layer.conductivityWmK;
  }

  function interpolateProfile(points, depthKm) {
    if (depthKm <= points[0].depthKm) return points[0].temperatureC;
    for (let index = 1; index < points.length; index += 1) {
      if (depthKm <= points[index].depthKm) {
        const previous = points[index - 1];
        const next = points[index];
        const span = next.depthKm - previous.depthKm;
        const fraction = span > 0 ? (depthKm - previous.depthKm) / span : 0;
        return previous.temperatureC + fraction * (next.temperatureC - previous.temperatureC);
      }
    }
    return points[points.length - 1].temperatureC;
  }

  function calculateSolution() {
    const analytical = calculateAnalyticalSolution();
    const numerical = calculateFiniteVolumeSolution();
    let maximumDifference = 0;
    numerical.points.forEach((point) => {
      maximumDifference = Math.max(maximumDifference, Math.abs(point.temperatureC - analyticalTemperatureAtDepth(point.depthKm, analytical)));
    });
    return { analytical, numerical, maximumDifferenceC: maximumDifference };
  }

  function createSvgElement(name, attributes = {}, text = null) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== null) node.textContent = text;
    return node;
  }

  function appendSvg(parent, name, attributes = {}, text = null) {
    const node = createSvgElement(name, attributes, text);
    parent.appendChild(node);
    return node;
  }

  function svgSize(svg) {
    const rectangle = svg.getBoundingClientRect();
    return { width: Math.max(360, rectangle.width), height: Math.max(400, rectangle.height) };
  }

  function niceMaximum(value) {
    if (!Number.isFinite(value) || value <= 0) return 100;
    const roughStep = value / 6;
    const exponent = 10 ** Math.floor(Math.log10(roughStep));
    const fraction = roughStep / exponent;
    const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    const step = niceFraction * exponent;
    return Math.ceil(value / step) * step;
  }

  function renderModelChart() {
    const svg = elements.modelChart;
    const { width, height } = svgSize(svg);
    const margin = { left: 66, right: 62, top: 55, bottom: 56 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const xA = (value) => margin.left + (value - A_MIN) / (A_MAX - A_MIN) * plotWidth;
    const xK = (value) => margin.left + (value - K_MIN) / (K_MAX - K_MIN) * plotWidth;
    const yDepth = (value) => margin.top + value / state.totalDepthKm * plotHeight;

    const defs = appendSvg(svg, "defs");
    const clipPath = appendSvg(defs, "clipPath", { id: "modelPlotClip" });
    appendSvg(clipPath, "rect", { x: margin.left, y: margin.top, width: plotWidth, height: plotHeight });

    for (let tick = 0; tick <= 5; tick += 1) {
      const depth = state.totalDepthKm * tick / 5;
      const y = yDepth(depth);
      appendSvg(svg, "line", { x1: margin.left, x2: margin.left + plotWidth, y1: y, y2: y, class: "grid-line" });
      appendSvg(svg, "text", { x: margin.left - 9, y: y + 4, class: "axis-text", "text-anchor": "end" }, depth.toFixed(depth < 10 ? 1 : 0));
    }

    for (let tick = 0; tick <= 4; tick += 1) {
      const value = A_MAX * tick / 4;
      const x = xA(value);
      appendSvg(svg, "line", { x1: x, x2: x, y1: margin.top - 4, y2: margin.top, stroke: "#d95f24" });
      appendSvg(svg, "text", { x, y: margin.top - 13, class: "axis-text", fill: "#b64b1b", "text-anchor": "middle" }, value.toFixed(1));
    }
    for (let tick = 0; tick <= 5; tick += 1) {
      const value = K_MIN + (K_MAX - K_MIN) * tick / 5;
      const x = xK(value);
      appendSvg(svg, "line", { x1: x, x2: x, y1: margin.top + plotHeight, y2: margin.top + plotHeight + 4, stroke: "#1976a3" });
      appendSvg(svg, "text", { x, y: margin.top + plotHeight + 18, class: "axis-text", fill: "#17698f", "text-anchor": "middle" }, value.toFixed(1));
    }

    appendSvg(svg, "text", { x: margin.left + plotWidth / 2, y: 15, class: "axis-label", fill: "#b64b1b", "text-anchor": "middle" }, "Heat generation, A (µW m⁻³)");
    appendSvg(svg, "text", { x: margin.left + plotWidth / 2, y: height - 7, class: "axis-label", fill: "#17698f", "text-anchor": "middle" }, "Thermal conductivity, k (W m⁻¹ K⁻¹)");
    appendSvg(svg, "text", { x: 16, y: margin.top + plotHeight / 2, class: "axis-label", transform: `rotate(-90 16 ${margin.top + plotHeight / 2})`, "text-anchor": "middle" }, "Depth (km)");

    const plotGroup = appendSvg(svg, "g", { "clip-path": "url(#modelPlotClip)" });
    state.layers.forEach((layer, index) => {
      const topKm = layerTopKm(index);
      const topY = yDepth(topKm);
      const bottomY = yDepth(layer.bottomKm);
      const band = appendSvg(plotGroup, "rect", {
        x: margin.left,
        y: topY,
        width: plotWidth,
        height: bottomY - topY,
        fill: index % 2 === 0 ? "#f5f7f8" : "#edf2f4",
        class: `layer-band${state.selectedLayer === index ? " selected" : ""}`,
        "data-select-layer": index
      });
      band.addEventListener("pointerdown", () => selectLayer(index));

      const midY = (topY + bottomY) / 2;
      appendSvg(plotGroup, "text", { x: margin.left + 8, y: topY + 15, class: "layer-label" }, `L${index + 1}`);

      const heatX = xA(layer.heatGenerationMicroWm3);
      appendSvg(plotGroup, "line", { x1: heatX, x2: heatX, y1: topY + 2, y2: bottomY - 2, stroke: "#d95f24", "stroke-width": 5, class: "property-handle", "data-drag": "heat", "data-layer": index });
      appendSvg(plotGroup, "circle", { cx: heatX, cy: midY, r: 10, fill: "#d95f24", class: "property-handle", "data-drag": "heat", "data-layer": index });
      appendSvg(plotGroup, "text", { x: heatX, y: midY + 0.5, class: "drag-label" }, "A");

      const conductivityX = xK(layer.conductivityWmK);
      appendSvg(plotGroup, "line", { x1: conductivityX, x2: conductivityX, y1: topY + 2, y2: bottomY - 2, stroke: "#1976a3", "stroke-width": 5, class: "property-handle", "data-drag": "conductivity", "data-layer": index });
      appendSvg(plotGroup, "circle", { cx: conductivityX, cy: midY, r: 10, fill: "#1976a3", class: "property-handle", "data-drag": "conductivity", "data-layer": index });
      appendSvg(plotGroup, "text", { x: conductivityX, y: midY + 0.5, class: "drag-label" }, "k");
    });

    for (let index = 0; index < state.layers.length - 1; index += 1) {
      const y = yDepth(state.layers[index].bottomKm);
      appendSvg(svg, "line", { x1: margin.left, x2: margin.left + plotWidth, y1: y, y2: y, class: "boundary-line" });
      appendSvg(svg, "line", { x1: margin.left, x2: margin.left + plotWidth, y1: y, y2: y, class: "boundary-hit", "data-drag": "boundary", "data-layer": index });
      appendSvg(svg, "rect", { x: margin.left + plotWidth - 27, y: y - 7, width: 25, height: 14, rx: 3, fill: "#34454f", "pointer-events": "none" });
      appendSvg(svg, "text", { x: margin.left + plotWidth - 14.5, y: y + 0.5, class: "drag-label" }, "↕");
    }

    appendSvg(svg, "rect", { x: margin.left, y: margin.top, width: plotWidth, height: plotHeight, class: "plot-border" });
    svg.dataset.plotLeft = String(margin.left);
    svg.dataset.plotTop = String(margin.top);
    svg.dataset.plotWidth = String(plotWidth);
    svg.dataset.plotHeight = String(plotHeight);
  }

  function renderGeothermChart() {
    const svg = elements.geothermChart;
    const { width, height } = svgSize(svg);
    const margin = { left: 68, right: 24, top: 46, bottom: 46 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const allTemperatures = currentSolution.analytical.points.concat(currentSolution.numerical.points).map((point) => point.temperatureC);
    const minimumTemperature = Math.min(0, Math.floor(Math.min(...allTemperatures) / 50) * 50);
    const maximumTemperature = niceMaximum(Math.max(...allTemperatures) * 1.04);
    const xTemperature = (value) => margin.left + (value - minimumTemperature) / (maximumTemperature - minimumTemperature) * plotWidth;
    const yDepth = (value) => margin.top + value / state.totalDepthKm * plotHeight;

    const defs = appendSvg(svg, "defs");
    const clipPath = appendSvg(defs, "clipPath", { id: "geothermPlotClip" });
    appendSvg(clipPath, "rect", { x: margin.left, y: margin.top, width: plotWidth, height: plotHeight });

    for (let tick = 0; tick <= 5; tick += 1) {
      const depth = state.totalDepthKm * tick / 5;
      const y = yDepth(depth);
      appendSvg(svg, "line", { x1: margin.left, x2: margin.left + plotWidth, y1: y, y2: y, class: "grid-line" });
      appendSvg(svg, "text", { x: margin.left - 9, y: y + 4, class: "axis-text", "text-anchor": "end" }, depth.toFixed(depth < 10 ? 1 : 0));
    }
    for (let tick = 0; tick <= 6; tick += 1) {
      const temperature = minimumTemperature + (maximumTemperature - minimumTemperature) * tick / 6;
      const x = xTemperature(temperature);
      appendSvg(svg, "line", { x1: x, x2: x, y1: margin.top, y2: margin.top + plotHeight, class: "grid-line" });
      appendSvg(svg, "text", { x, y: margin.top - 12, class: "axis-text", "text-anchor": "middle" }, Math.round(temperature));
    }

    state.layers.slice(0, -1).forEach((layer) => {
      const y = yDepth(layer.bottomKm);
      appendSvg(svg, "line", { x1: margin.left, x2: margin.left + plotWidth, y1: y, y2: y, class: "depth-guide" });
    });

    appendSvg(svg, "text", { x: margin.left + plotWidth / 2, y: 16, class: "axis-label", "text-anchor": "middle" }, "Temperature (°C)");
    appendSvg(svg, "text", { x: 16, y: margin.top + plotHeight / 2, class: "axis-label", transform: `rotate(-90 16 ${margin.top + plotHeight / 2})`, "text-anchor": "middle" }, "Depth (km)");

    const pathFromPoints = (points) => points.map((point, index) => `${index === 0 ? "M" : "L"}${xTemperature(point.temperatureC).toFixed(2)},${yDepth(point.depthKm).toFixed(2)}`).join(" ");
    const plotGroup = appendSvg(svg, "g", { "clip-path": "url(#geothermPlotClip)" });
    appendSvg(plotGroup, "path", { d: pathFromPoints(currentSolution.analytical.points), class: "profile-analytical" });
    appendSvg(plotGroup, "path", { d: pathFromPoints(currentSolution.numerical.points), class: "profile-numerical" });
    appendSvg(svg, "rect", { x: margin.left, y: margin.top, width: plotWidth, height: plotHeight, class: "plot-border" });
  }

  function renderTable() {
    const rows = currentSolution.analytical.summaries.map((summary, index) => {
      const selectedClass = index === state.selectedLayer ? " class=\"selected\"" : "";
      return `<tr data-row-layer="${index}"${selectedClass}>
        <td>Layer ${index + 1}</td>
        <td>${summary.topKm.toFixed(2)}</td>
        <td>${summary.bottomKm.toFixed(2)}</td>
        <td>${summary.thicknessKm.toFixed(2)}</td>
        <td><input type="number" min="${A_MIN}" max="${A_MAX}" step="0.05" value="${summary.heatGenerationMicroWm3.toFixed(2)}" data-table-property="heat" data-layer="${index}" aria-label="Layer ${index + 1} heat generation"></td>
        <td><input type="number" min="${K_MIN}" max="${K_MAX}" step="0.05" value="${summary.conductivityWmK.toFixed(2)}" data-table-property="conductivity" data-layer="${index}" aria-label="Layer ${index + 1} thermal conductivity"></td>
        <td>${summary.topHeatFlowMilliWm2.toFixed(2)}</td>
        <td>${summary.topTemperatureC.toFixed(1)}</td>
      </tr>`;
    }).join("");
    elements.tableBody.innerHTML = rows;
  }

  function renderMetrics() {
    const analytical = currentSolution.analytical;
    elements.surfaceHeatFlow.textContent = `${analytical.surfaceHeatFlowMilliWm2.toFixed(1)} mW m⁻²`;
    elements.bottomTemperature.textContent = `${analytical.bottomTemperatureC.toFixed(1)} °C`;
    const difference = currentSolution.maximumDifferenceC;
    elements.solutionDifference.textContent = difference < 0.01 ? `${difference.toExponential(2)} °C` : `${difference.toFixed(3)} °C`;
    elements.thermalResistance.textContent = `${(analytical.thermalResistanceM2KW / 1000).toFixed(2)} ×10³ m² K W⁻¹`;
  }

  function syncControls() {
    elements.surfaceTemperature.value = String(state.surfaceTemperatureC);
    elements.basalHeatFlow.value = String(state.basalHeatFlowMilliWm2);
    elements.totalDepth.value = String(state.totalDepthKm);
    elements.cellCount.value = String(state.cellCount);
    elements.layerCount.value = String(state.layers.length);
    const selected = state.layers[state.selectedLayer];
    elements.selectedLayerLabel.textContent = `Layer ${state.selectedLayer + 1}: ${layerTopKm(state.selectedLayer).toFixed(2)}–${selected.bottomKm.toFixed(2)} km`;
    elements.selectedA.value = selected.heatGenerationMicroWm3.toFixed(2);
    elements.selectedK.value = selected.conductivityWmK.toFixed(2);
    elements.merge.disabled = state.layers.length <= 1;
    elements.split.disabled = state.layers.length >= MAX_LAYERS;
  }

  function updateAll() {
    normalizeState();
    currentSolution = calculateSolution();
    syncControls();
    renderModelChart();
    renderGeothermChart();
    renderTable();
    renderMetrics();
  }

  function scheduleUpdate() {
    if (frameRequest !== null) return;
    frameRequest = requestAnimationFrame(() => {
      frameRequest = null;
      updateAll();
    });
  }

  function selectLayer(index) {
    state.selectedLayer = clamp(index, 0, state.layers.length - 1);
    scheduleUpdate();
  }

  function splitLayer(index = state.selectedLayer) {
    if (state.layers.length >= MAX_LAYERS) return;
    const topKm = layerTopKm(index);
    const layer = state.layers[index];
    const minimumThickness = minimumLayerThicknessKm();
    if (layer.bottomKm - topKm < 2 * minimumThickness) return;
    const oldBottom = layer.bottomKm;
    const midpoint = (topKm + oldBottom) / 2;
    layer.bottomKm = midpoint;
    state.layers.splice(index + 1, 0, {
      bottomKm: oldBottom,
      heatGenerationMicroWm3: layer.heatGenerationMicroWm3,
      conductivityWmK: layer.conductivityWmK
    });
    state.selectedLayer = index + 1;
    updateAll();
  }

  function mergeLayer(index = state.selectedLayer) {
    if (state.layers.length <= 1) return;
    const firstIndex = index < state.layers.length - 1 ? index : index - 1;
    const secondIndex = firstIndex + 1;
    const first = state.layers[firstIndex];
    const second = state.layers[secondIndex];
    const topKm = layerTopKm(firstIndex);
    const firstThickness = first.bottomKm - topKm;
    const secondThickness = second.bottomKm - first.bottomKm;
    const totalThickness = firstThickness + secondThickness;
    first.heatGenerationMicroWm3 = (first.heatGenerationMicroWm3 * firstThickness + second.heatGenerationMicroWm3 * secondThickness) / totalThickness;
    first.conductivityWmK = totalThickness / (firstThickness / first.conductivityWmK + secondThickness / second.conductivityWmK);
    first.bottomKm = second.bottomKm;
    state.layers.splice(secondIndex, 1);
    state.selectedLayer = firstIndex;
    updateAll();
  }

  function setLayerCount(targetCount) {
    const target = Math.round(clamp(targetCount, 1, MAX_LAYERS));
    while (state.layers.length < target) {
      let thickestIndex = 0;
      let thickestValue = -Infinity;
      state.layers.forEach((layer, index) => {
        const thickness = layer.bottomKm - layerTopKm(index);
        if (thickness > thickestValue) {
          thickestIndex = index;
          thickestValue = thickness;
        }
      });
      splitLayer(thickestIndex);
    }
    while (state.layers.length > target) {
      let thinnestPair = 0;
      let thinnestValue = Infinity;
      for (let index = 0; index < state.layers.length - 1; index += 1) {
        const combinedThickness = state.layers[index + 1].bottomKm - layerTopKm(index);
        if (combinedThickness < thinnestValue) {
          thinnestPair = index;
          thinnestValue = combinedThickness;
        }
      }
      mergeLayer(thinnestPair);
    }
    state.selectedLayer = Math.min(state.selectedLayer, state.layers.length - 1);
    updateAll();
  }

  function pointerCoordinates(event, svg) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return { x: transformed.x, y: transformed.y };
  }

  elements.modelChart.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("[data-drag]");
    if (!target) return;
    event.preventDefault();
    const index = Number(target.dataset.layer);
    state.selectedLayer = index;
    dragState = { type: target.dataset.drag, layer: index, pointerId: event.pointerId };
    elements.modelChart.setPointerCapture(event.pointerId);
  });

  elements.modelChart.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const coordinates = pointerCoordinates(event, elements.modelChart);
    const left = Number(elements.modelChart.dataset.plotLeft);
    const top = Number(elements.modelChart.dataset.plotTop);
    const width = Number(elements.modelChart.dataset.plotWidth);
    const height = Number(elements.modelChart.dataset.plotHeight);
    const layer = state.layers[dragState.layer];

    if (dragState.type === "heat") {
      layer.heatGenerationMicroWm3 = clamp((coordinates.x - left) / width * (A_MAX - A_MIN) + A_MIN, A_MIN, A_MAX);
    } else if (dragState.type === "conductivity") {
      layer.conductivityWmK = clamp((coordinates.x - left) / width * (K_MAX - K_MIN) + K_MIN, K_MIN, K_MAX);
    } else if (dragState.type === "boundary") {
      const minimumThickness = minimumLayerThicknessKm();
      const upperBoundary = dragState.layer === 0 ? 0 : state.layers[dragState.layer - 1].bottomKm;
      const lowerBoundary = state.layers[dragState.layer + 1].bottomKm;
      const requestedDepth = (coordinates.y - top) / height * state.totalDepthKm;
      layer.bottomKm = clamp(requestedDepth, upperBoundary + minimumThickness, lowerBoundary - minimumThickness);
    }
    scheduleUpdate();
  });

  function endPointerDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (elements.modelChart.hasPointerCapture(event.pointerId)) elements.modelChart.releasePointerCapture(event.pointerId);
    dragState = null;
  }
  elements.modelChart.addEventListener("pointerup", endPointerDrag);
  elements.modelChart.addEventListener("pointercancel", endPointerDrag);

  elements.surfaceTemperature.addEventListener("change", () => { state.surfaceTemperatureC = finiteNumber(elements.surfaceTemperature.value, state.surfaceTemperatureC); updateAll(); });
  elements.basalHeatFlow.addEventListener("change", () => { state.basalHeatFlowMilliWm2 = finiteNumber(elements.basalHeatFlow.value, state.basalHeatFlowMilliWm2); updateAll(); });
  elements.cellCount.addEventListener("change", () => { state.cellCount = finiteNumber(elements.cellCount.value, state.cellCount); updateAll(); });
  elements.totalDepth.addEventListener("change", () => {
    const oldDepth = state.totalDepthKm;
    const newDepth = clamp(finiteNumber(elements.totalDepth.value, oldDepth), 1, 100);
    state.layers.forEach((layer) => { layer.bottomKm = layer.bottomKm / oldDepth * newDepth; });
    state.totalDepthKm = newDepth;
    updateAll();
  });
  elements.layerCount.addEventListener("change", () => setLayerCount(finiteNumber(elements.layerCount.value, state.layers.length)));
  elements.selectedA.addEventListener("change", () => { state.layers[state.selectedLayer].heatGenerationMicroWm3 = finiteNumber(elements.selectedA.value, state.layers[state.selectedLayer].heatGenerationMicroWm3); updateAll(); });
  elements.selectedK.addEventListener("change", () => { state.layers[state.selectedLayer].conductivityWmK = finiteNumber(elements.selectedK.value, state.layers[state.selectedLayer].conductivityWmK); updateAll(); });
  elements.split.addEventListener("click", () => splitLayer());
  elements.merge.addEventListener("click", () => mergeLayer());
  elements.reset.addEventListener("click", () => { state = defaultModel(); updateAll(); });

  elements.tableBody.addEventListener("click", (event) => {
    const row = event.target.closest("[data-row-layer]");
    if (row) selectLayer(Number(row.dataset.rowLayer));
  });
  elements.tableBody.addEventListener("change", (event) => {
    const input = event.target.closest("[data-table-property]");
    if (!input) return;
    const index = Number(input.dataset.layer);
    if (input.dataset.tableProperty === "heat") state.layers[index].heatGenerationMicroWm3 = finiteNumber(input.value, state.layers[index].heatGenerationMicroWm3);
    if (input.dataset.tableProperty === "conductivity") state.layers[index].conductivityWmK = finiteNumber(input.value, state.layers[index].conductivityWmK);
    state.selectedLayer = index;
    updateAll();
  });

  function downloadBlob(content, mimeType, fileName) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  elements.downloadCsv.addEventListener("click", () => {
    const rows = ["depth_km,analytical_temperature_C,finite_volume_temperature_C"];
    currentSolution.numerical.points.forEach((point) => {
      const analyticalTemperature = analyticalTemperatureAtDepth(point.depthKm, currentSolution.analytical);
      rows.push(`${point.depthKm.toFixed(6)},${analyticalTemperature.toFixed(6)},${point.temperatureC.toFixed(6)}`);
    });
    downloadBlob(rows.join("\n"), "text/csv;charset=utf-8", "geothermal_profile.csv");
  });

  elements.downloadModel.addEventListener("click", () => {
    const exportState = { ...state, version: 1, equation: "d/dz(k dT/dz) + A = 0" };
    downloadBlob(JSON.stringify(exportState, null, 2), "application/json", "geothermal_layer_model.json");
  });

  elements.loadModel.addEventListener("change", async () => {
    const file = elements.loadModel.files && elements.loadModel.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.layers) || imported.layers.length < 1) throw new Error("The model does not contain layers.");
      state = {
        surfaceTemperatureC: imported.surfaceTemperatureC,
        basalHeatFlowMilliWm2: imported.basalHeatFlowMilliWm2,
        totalDepthKm: imported.totalDepthKm,
        cellCount: imported.cellCount,
        selectedLayer: 0,
        layers: imported.layers.map((layer) => ({
          bottomKm: layer.bottomKm,
          heatGenerationMicroWm3: layer.heatGenerationMicroWm3,
          conductivityWmK: layer.conductivityWmK
        }))
      };
      updateAll();
    } catch (error) {
      window.alert(`Unable to load model: ${error.message}`);
    } finally {
      elements.loadModel.value = "";
    }
  });

  elements.methodButton.addEventListener("click", () => {
    if (typeof elements.methodDialog.showModal === "function") {
      elements.methodDialog.showModal();
    } else {
      elements.methodDialog.setAttribute("open", "");
    }
  });
  elements.methodDialogClose.addEventListener("click", () => elements.methodDialog.close());
  elements.methodDialog.addEventListener("click", (event) => {
    if (event.target === elements.methodDialog) elements.methodDialog.close();
  });

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());
  resizeObserver.observe(elements.modelChart.parentElement);
  resizeObserver.observe(elements.geothermChart.parentElement);
  updateAll();
})();
