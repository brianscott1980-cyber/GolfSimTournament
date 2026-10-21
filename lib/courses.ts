export type Course = {
  id: string;
  name: string;
  location: string;
  country: string;
  par?: number;
  image: string;
  source: string;
  gsproSource?: string;
  imageCredit?: string;
  imageSource?: string;
  imageKind?: string;
  designer?: string;
  version?: string;
  access?: "Creator-supported" | "Library listing";
  style?: string;
  description?: string;
  selectionSource?: string;
  pick?: number;
  checkedAt?: string;
  flyover?: string;
};

export const clubhouseCourses: Course[] = [
  {
    id: "cabot",
    name: "Cabot Cliffs",
    location: "Inverness, Nova Scotia",
    country: "Canada",
    par: 72,
    image: "/images/coast.jpg",
    source: "https://simulatorgolftour.com/tournament/19336",
  },
  {
    id: "bandon",
    name: "Bandon Dunes",
    location: "Bandon, Oregon",
    country: "United States",
    par: 72,
    image: "/images/course.jpg",
    source:
      "https://20033507.fs1.hubspotusercontent-na1.net/hubfs/20033507/Product%20Documents/Software/GSPro%20Quick%20Start%20Guide.pdf",
  },
  {
    id: "ballyneal",
    name: "Ballyneal",
    location: "Holyoke, Colorado",
    country: "United States",
    par: 71,
    image: "/images/hills.jpg",
    source:
      "https://20033507.fs1.hubspotusercontent-na1.net/hubfs/20033507/Product%20Documents/Software/GSPro%20Quick%20Start%20Guide.pdf",
  },
  {
    id: "bethpage",
    name: "Bethpage Black",
    location: "Farmingdale, New York",
    country: "United States",
    par: 71,
    image: "/images/course.jpg",
    source:
      "https://20033507.fs1.hubspotusercontent-na1.net/hubfs/20033507/Product%20Documents/Software/GSPro%20Quick%20Start%20Guide.pdf",
  },
  {
    id: "currahee",
    name: "Currahee Golf Club",
    location: "Toccoa, Georgia",
    country: "United States",
    par: 72,
    image: "/images/currahee.jpg",
    source: "https://curraheeclub.com/the-currahee-club-golf-course",
    imageCredit: "Currahee Club",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/currahee-club",
  },
  {
    id: "trump-aberdeen",
    name: "Trump International Aberdeen",
    location: "Balmedie, Aberdeenshire",
    country: "Scotland",
    par: 72,
    image: "/images/courses/trump-aberdeen.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/trump-aberdeen-old-course",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/trump-aberdeen-old-course",
    imageCredit: "SGT / Neil McLauchlan",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_3646.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Neil McLauchlan",
    version: "1",
    access: "Library listing",
    style: "Links",
    description:
      "The original Aberdeen links, listed in GSPro as Trump Aberdeen Old Course.",
    checkedAt: "2026-10-21",
  },
  {
    id: "dpc-scottsdale",
    name: "DPC Scottsdale",
    location: "Phoenix, Arizona",
    country: "United States",
    par: 71,
    image: "/images/courses/dpc-scottsdale.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/dpc-scottsdale",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/dpc-scottsdale",
    imageCredit: "SGT / runpuddrun, rdeyer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_1358.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "runpuddrun, rdeyer",
    version: "3",
    access: "Library listing",
    style: "Desert",
    description: "An Arizona desert layout, listed in GSPro as DPC Scottsdale.",
    checkedAt: "2026-10-21",
  },
];

export const topCourses: Course[] = [
  {
    id: "pick-cabot-cliffs",
    name: "Cabot Cliffs · Updated",
    location: "Nova Scotia, Canada",
    country: "Canada",
    image: "/images/courses/cabot-cliffs.jpg",
    source: "https://tekbud.com/courses/cabot-cliffs",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/cabot-cliffs-patreon-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource: "https://tekbud.com/courses/cabot-cliffs-1.jpg",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "3",
    access: "Creator-supported",
    style: "Coastal",
    description:
      "Ocean horizons, coastal vegetation and beautifully textured fairways.",
    selectionSource: "https://tekbud.com/courses/cabot-cliffs",
    pick: 1,
    checkedAt: "2026-10-21",
  },
  {
    id: "pick-wolf-creek",
    name: "Wolf Creek Golf Club",
    location: "Mesquite, NV, USA",
    country: "United States",
    image: "/images/courses/wolf-creek.jpg",
    source: "https://tekbud.com/courses/wolf-creek",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/wolf-creek-golf-club-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource: "https://tekbud.com/courses/wolf-creek-1.jpg",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "4",
    access: "Creator-supported",
    style: "Desert",
    description:
      "Sunlit canyon walls and steep drops give every tee shot a sense of theatre.",
    selectionSource: "https://tekbud.com/courses/wolf-creek",
    pick: 2,
    checkedAt: "2026-10-21",
    par: 72,
  },
  {
    id: "pick-tara-iti",
    name: "Tara Iti Golf Club",
    location: "Mangawhai, New Zealand",
    country: "New Zealand",
    image: "/images/courses/tara-iti.png",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/tara-iti-golf-club-tekbud",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/tara-iti-golf-club-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource:
      "https://c10.patreonusercontent.com/4/patreon-media/p/post/122743292/fbf381c98dfb4d17959148ddb01e83df/eyJ3IjoxMDgwfQ%3D%3D/1.png?token-hash=Z3W1F3V_FhMU-AX72QoHN9Q6HC0fHTmTb9eBq-hLNVg%3D&token-time=1793836800",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "4",
    access: "Creator-supported",
    style: "Coastal",
    description:
      "Sandy contours and open sea views create a wonderfully natural setting.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1sxjuzs/what_is_everyones_top_10_favorite_gspro_courses/",
    pick: 3,
    checkedAt: "2026-10-21",
    par: 71,
    flyover: "https://www.youtube.com/watch?v=9_ilay_4u8U",
  },
  {
    id: "pick-jacks-point",
    name: "Jack’s Point",
    location: "Queenstown, New Zealand",
    country: "New Zealand",
    image: "/images/courses/jacks-point.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/jacks-point-tekbud",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/jacks-point-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource:
      "https://c10.patreonusercontent.com/4/patreon-media/p/post/149709439/bd91651dcaf04de98dd3d9ba87ce8664/eyJiIjoyNCwidyI6MTA4MH0%3D/1.jpeg?token-hash=jO4AAGDHhJDzNxGPpAL9mg2Ed9_wq1lJeU-FqYQx0HY%3D&token-time=1793836800",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "3",
    access: "Creator-supported",
    style: "Mountain",
    description:
      "Alpine scenery and lake views make this a memorable Queenstown escape.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/",
    pick: 4,
    checkedAt: "2026-10-21",
  },
  {
    id: "pick-te-arai-south",
    name: "Te Arai South",
    location: "Te Arai, New Zealand",
    country: "New Zealand",
    image: "/images/courses/te-arai-south.jpg",
    source: "https://tekbud.com/courses/te-arai-south",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/te-arai-south-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource: "https://tekbud.com/courses/te-arai-south-1.png",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "4",
    access: "Creator-supported",
    style: "Coastal",
    description:
      "Rolling dunes and ocean-side holes bring New Zealand links golf indoors.",
    selectionSource: "https://tekbud.com/courses/te-arai-south",
    pick: 5,
    checkedAt: "2026-10-21",
    flyover: "https://www.youtube.com/watch?v=n0Cs7L_PGYA",
  },
  {
    id: "pick-te-arai-north",
    name: "Te Arai North",
    location: "Te Arai, New Zealand",
    country: "New Zealand",
    image: "/images/courses/te-arai-north.jpg",
    source: "https://tekbud.com/courses/te-arai-north",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/te-arai-north-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource: "https://tekbud.com/courses/te-arai-north-1.png",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "4",
    access: "Creator-supported",
    style: "Coastal",
    description:
      "Coastal light and sculpted ground make the northern layout worth exploring.",
    selectionSource: "https://tekbud.com/courses/te-arai-north",
    pick: 6,
    checkedAt: "2026-10-21",
    flyover: "https://www.youtube.com/watch?v=jrx368cvOtg",
  },
  {
    id: "pick-dpc-pebble",
    name: "DPC Pebble",
    location: "Pebble Beach, CA",
    country: "United States",
    image: "/images/courses/dpc-pebble.jpg",
    source: "https://tpl.realitysportsonline.com/discover/courses/dpc-pebble",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/dpc-pebble",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_383.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "RustyDave,RDeyer,Greg McD",
    version: "4",
    access: "Library listing",
    style: "Coastal",
    description:
      "A familiar Pacific coastline with a dramatic run of ocean-side holes.",
    selectionSource: "https://thecourseview.com/guides/best-gspro-courses",
    pick: 7,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=ak2Z1CJkaxE",
  },
  {
    id: "pick-greywolf",
    name: "Greywolf Golf Course",
    location: "Panorama, British Columbia, Canada",
    country: "Canada",
    image: "/images/courses/greywolf.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/greywolf-golf-course",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/greywolf-golf-course",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_1374.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Tsquared",
    version: "4",
    access: "Library listing",
    style: "Mountain",
    description:
      "Mountain backdrops frame elevated tees and forest-lined fairways.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/",
    pick: 8,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=UgZn4iElw2U",
  },
  {
    id: "pick-cda-national",
    name: "CDA National Reserve",
    location: "Coeur d'Alene, Idaho, USA",
    country: "United States",
    image: "/images/courses/cda-national.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/cda-national-reserve",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/cda-national-reserve",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_3200.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "JPruitt10",
    version: "2",
    access: "Library listing",
    style: "Mountain",
    description:
      "Idaho woodland, changing elevation and water views create a striking backdrop.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/",
    pick: 9,
    checkedAt: "2026-10-21",
    par: 72,
  },
  {
    id: "pick-wade-hampton",
    name: "Wade Hampton",
    location: "Cashiers, NC, USA",
    country: "United States",
    image: "/images/courses/wade-hampton.jpg",
    source: "https://tekbud.com/courses/wade-hampton",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/wade-hampton-tekbud",
    imageCredit: "Tekbud Designs",
    imageSource: "https://tekbud.com/courses/wade-hampton-1.png",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "4",
    access: "Creator-supported",
    style: "Mountain",
    description:
      "Wooded mountain golf with detailed planting and a quiet, secluded feel.",
    selectionSource: "https://tekbud.com/courses/wade-hampton",
    pick: 10,
    checkedAt: "2026-10-21",
  },
  {
    id: "pick-domaine-laforest",
    name: "Domaine Laforest",
    location: "Charlevoix-Est, QC",
    country: "Canada",
    image: "/images/courses/domaine-laforest.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/domaine-laforest",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/domaine-laforest",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_700.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Kraizzed",
    version: "3",
    access: "Library listing",
    style: "Parkland",
    description:
      "A richly wooded Canadian setting with water adding contrast to the fairways.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/",
    pick: 11,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=9MGjVMcPgr8",
  },
  {
    id: "pick-quail-hollow",
    name: "Quail Hollow · Championship",
    location: "Charlotte, North Carolina",
    country: "United States",
    image: "/images/courses/quail-hollow.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/quail-hollow-club-championship-edition",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/quail-hollow-club-championship-edition",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_2442.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "CE Simgolf",
    version: "2",
    access: "Library listing",
    style: "Parkland",
    description:
      "Choose the Championship Edition for a detailed tournament-style presentation.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/",
    pick: 12,
    checkedAt: "2026-10-21",
    par: 71,
    flyover: "https://www.youtube.com/watch?v=tD7Q7ZfBUz4",
  },
  {
    id: "pick-paynes-valley",
    name: "Payne’s Valley",
    location: "Hollister, MO",
    country: "United States",
    image: "/images/courses/paynes-valley.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/paynes-valley",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/paynes-valley",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_573.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "runpuddrun",
    version: "5",
    access: "Library listing",
    style: "Mountain",
    description:
      "Broad fairways and elevated Ozarks views suit a relaxed evening with the four.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/",
    pick: 13,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=0lTRfNWynkg",
  },
  {
    id: "pick-manele",
    name: "Manele Golf Course",
    location: "Lanai City, Hawaii, USA",
    country: "United States",
    image: "/images/courses/manele.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/manele-golf-course",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/manele-golf-course",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_3282.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Mseaman, JPruitt10",
    version: "1",
    access: "Library listing",
    style: "Tropical",
    description:
      "Ocean cliffs and Hawaiian scenery give the round a distinct island feel.",
    selectionSource: "https://thecourseview.com/guides/best-gspro-courses",
    pick: 14,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=Tt_rHfqEN_Y",
  },
  {
    id: "pick-cape-kidnappers",
    name: "Cape Kidnappers",
    location: "Hawke's Bay, New Zealand",
    country: "New Zealand",
    image: "/images/courses/cape-kidnappers.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/cape-kidnappers",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/cape-kidnappers",
    imageCredit: "GSPro flyover · YouTube",
    imageSource: "https://i.ytimg.com/vi/EHGM-BsQ5JA/hqdefault.jpg",
    imageKind: "Flyover preview",
    designer: "Pob16",
    version: "1",
    access: "Library listing",
    style: "Coastal",
    description:
      "Dramatic coastal ridges make this a distinctive visual change of pace.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/",
    pick: 15,
    checkedAt: "2026-10-21",
    par: 71,
    flyover: "https://www.youtube.com/watch?v=EHGM-BsQ5JA",
  },
  {
    id: "pick-old-macdonald",
    name: "Old Macdonald Golf Course",
    location: "Bandon, Oregon, USA",
    country: "United States",
    image: "/images/courses/old-macdonald.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/old-macdonald-golf-course",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/old-macdonald-golf-course",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_1869.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Tsquared",
    version: "2",
    access: "Library listing",
    style: "Links",
    description:
      "Open dunes and expansive greens capture the character of Bandon links golf.",
    selectionSource: "https://thecourseview.com/guides/best-gspro-courses",
    pick: 16,
    checkedAt: "2026-10-21",
    par: 71,
    flyover: "https://www.youtube.com/watch?v=D_6aM8ZzhEg",
  },
  {
    id: "pick-georgia-golf-club",
    name: "Georgia Golf Club",
    location: "Augusta, GA",
    country: "United States",
    image: "/images/courses/georgia-golf-club.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/georgia-golf-club",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/georgia-golf-club",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_347.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Tekbud",
    version: "9",
    access: "Library listing",
    style: "Parkland",
    description:
      "A familiar championship-inspired setting, framed by trees, water and bright sand.",
    selectionSource: "https://thecourseview.com/guides/best-gspro-courses",
    pick: 17,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=42PdcdabSu4",
  },
  {
    id: "pick-streamsong-red",
    name: "Streamsong Red",
    location: "Bowling Green, FL",
    country: "United States",
    image: "/images/courses/streamsong-red.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/streamsong-red",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/streamsong-red",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_731.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "Adamtc4",
    version: "4",
    access: "Library listing",
    style: "Links",
    description:
      "Exposed sand and rolling ground offer a change from tree-lined parkland.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1c6fs86/gspro_best_courses/",
    pick: 18,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=cgmL-LqPotQ",
  },
  {
    id: "pick-whispering-pines",
    name: "Whispering Pines",
    location: "Evans, MN USA",
    country: "United States",
    image: "/images/courses/whispering-pines.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/whispering-pines",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/whispering-pines",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_723.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "OPCD-Sting, DPR, JM",
    version: "2",
    access: "Library listing",
    style: "Woodland",
    description:
      "Immersive woodland surrounds reward a slower look between shots.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/",
    pick: 19,
    checkedAt: "2026-10-21",
    par: 72,
    flyover: "https://www.youtube.com/watch?v=NUz8unMAv1g",
  },
  {
    id: "pick-mattaponi-springs",
    name: "Mattaponi Springs",
    location: "Ruther Glen, VA",
    country: "United States",
    image: "/images/courses/mattaponi-springs.jpg",
    source:
      "https://tpl.realitysportsonline.com/discover/courses/mattaponi-springs",
    gsproSource:
      "https://tpl.realitysportsonline.com/discover/courses/mattaponi-springs",
    imageCredit: "SGT / course designer",
    imageSource:
      "https://simulatorgolftour.com/public/assets/courseImages/splashes/cmp/splash_425.jpg?v=1.1",
    imageKind: "GSPro preview",
    designer: "RCPerkinsJr",
    version: "6",
    access: "Library listing",
    style: "Parkland",
    description:
      "Tree-lined holes and water make an appealing classic parkland round.",
    selectionSource:
      "https://www.reddit.com/r/Golfsimulator/comments/1su2wb8/gs_pro_courses_with_the_best_graphics/",
    pick: 20,
    checkedAt: "2026-10-21",
    par: 72,
  },
];

export const courses: Course[] = [...clubhouseCourses, ...topCourses];
