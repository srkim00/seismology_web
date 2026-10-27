// Shared tool catalog. Courses select tools by ID; the legacy /tools page
// uses the same records and order. Source applications remain independent.
export const TEACHING_TOOL_IDS = ["gravity-forward", "geothermal-1d"] as const;
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
};
