// Shared tool catalog. Courses select tools by ID; the legacy /tools page
// uses the same records and order. Source applications remain independent.
export const TEACHING_TOOL_IDS = [
  "gravity-forward",
  "geothermal-1d",
  "mantle-potential-temperature",
  "geoelectricity-electrodes",
  "geoelectricity-sounding",
  "geoelectricity-skin-depth"
] as const;
export type TeachingToolId = (typeof TEACHING_TOOL_IDS)[number];

export interface TeachingTool {
  id: TeachingToolId;
  title: string;
  description: string;
  src: string;
  height: number;
}

export const teachingTools: Record<TeachingToolId, TeachingTool> = {
  "gravity-forward": {
    id: "gravity-forward",
    title: "3D Gravity Forward Modeller",
    description: "Edit a three-dimensional density model and calculate its gravity response using an analytical rectangular-prism kernel.",
    src: "/tools/gravity-forward/",
    height: 780,
  },
  "geothermal-1d": {
    id: "geothermal-1d",
    title: "1D Layered Geothermal Modeler",
    description: "Edit layer depths, heat generation, and thermal conductivity; compare analytical and finite-volume solutions for steady-state vertical heat conduction.",
    src: "/tools/geothermal-1d/",
    height: 1040,
  },
  "mantle-potential-temperature": {
    id: "mantle-potential-temperature",
    title: "Mantle Potential Temperature Forward Modeler",
    description: "Compare tectonic settings by varying mantle potential temperature, lithosphere thickness, water, and composition; model geotherms, solidus crossings, density, and first-order P- and S-wave velocity responses.",
    src: "/tools/mantle-potential-temperature/",
    height: 1240,
  },
  "geoelectricity-electrodes": {
    id: "geoelectricity-electrodes",
    title: "Four-Electrode Resistivity",
    description: "Change electrode spacing, current, and ground resistivity to connect measured voltage with apparent resistivity.",
    src: "/classes/geophysics/geoelectricity-labs/electrodes.html",
    height: 1100,
  },
  "geoelectricity-sounding": {
    id: "geoelectricity-sounding",
    title: "Two-Layer Resistivity Sounding",
    description: "Change layer resistivities and thickness to see how a two-layer Earth shapes the Wenner sounding curve.",
    src: "/classes/geophysics/geoelectricity-labs/sounding.html",
    height: 1100,
  },
  "geoelectricity-skin-depth": {
    id: "geoelectricity-skin-depth",
    title: "Electromagnetic Skin Depth",
    description: "Compare how frequency and ground resistivity control electromagnetic field attenuation with depth.",
    src: "/classes/geophysics/geoelectricity-labs/skin-depth.html",
    height: 1100,
  },
};
