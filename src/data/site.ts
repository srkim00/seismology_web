// Site-wide singletons (identity, contact, social, navigation).
// Kept here rather than in a content collection so layout components can
// import them directly.
//
// Update this file when the laboratory name, address, links, or navigation change.

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  pi: string;
  institution: string;
  institutionUrl: string;
  university: string;
  universityUrl: string;
  url: string;
  description: string;
  email: string;
  phone: string;
  address: string[];
  mapQuery: string;
  social: {
    scholar?: string;
    researchgate?: string;
    twitter?: string;
    github?: string;
  };
  nav: NavItem[];
}

export const site: SiteConfig = {
  name: "Seismology Laboratory",
  shortName: "Seismology Lab",
  pi: "Seongryong Kim, Ph.D.",
  institution: "Department of Earth and Environmental Sciences",
  institutionUrl: "https://ees.korea.ac.kr/eaes/index.do",
  university: "Korea University",
  universityUrl: "https://www.korea.edu/en/index.do",
  url: "https://srkim00.github.io/seismology_web/",
  description:
    "We study Earth structure, earthquake processes, seismic hazards, and environmental change using observational seismology, numerical modelling, Bayesian inversion, and machine-learning methods.",
  email: "seongryongkim(at)korea.ac.kr",
  phone: "",
  address: [
    "Room 611, Mediheal EES Building",
    "Department of Earth and Environmental Sciences",
    "Korea University",
    "145 Anam-ro, Seongbuk-gu, Seoul 02841, Republic of Korea",
  ],
  mapQuery: "37.585499,127.025589",
  social: {
    scholar: "https://scholar.google.co.kr/citations?hl=ko&user=uNx-PRQAAAAJ",
    researchgate: "https://www.researchgate.net/profile/Seongryong-Kim",
  },
  nav: [
    { label: "People", href: "/people" },
    { label: "Research", href: "/research" },
    { label: "Publications", href: "/publications" },
    { label: "Tools & Teaching", href: "/tools" },
    { label: "Contact", href: "/contact" },
  ],
};
