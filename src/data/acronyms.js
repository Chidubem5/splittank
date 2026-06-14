// Maps acronyms / short names to full place names used in Mapbox search.
// Values can be a string (one unambiguous match) or an array (multiple possible matches).
// When an array, PlaceAutocomplete runs one Mapbox search per item and merges results,
// so the user sees all realistic options and can pick the right one.
//
// expandAcronym() tries exact match first, then uppercased, so "ucf" and "UCF" both work.

const ACRONYMS = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AMBIGUOUS ACRONYMS — arrays so all matching schools/places are shown
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  AU:  ['Auburn University Alabama', 'American University Washington DC'],
  BC:  ['Boston College Chestnut Hill Massachusetts', 'Bates College Lewiston Maine', 'Babson College Wellesley Massachusetts'],
  BU:  ['Boston University Massachusetts', 'Baylor University Waco Texas', 'Butler University Indianapolis Indiana'],
  CSU: ['Colorado State University Fort Collins', 'Cleveland State University Ohio', 'Chicago State University Illinois'],
  GU:  ['Georgetown University Washington DC', 'Gonzaga University Spokane Washington', 'Gallaudet University Washington DC'],
  ISU: ['Iowa State University Ames', 'Illinois State University Normal Illinois', 'Idaho State University Pocatello', 'Indiana State University Terre Haute'],
  MSU: ['Michigan State University East Lansing', 'Mississippi State University Starkville', 'Montana State University Bozeman', 'Missouri State University Springfield'],
  NU:  ['Northwestern University Evanston Illinois', 'Northeastern University Boston Massachusetts', 'University of Nebraska Lincoln'],
  OSU: ['Ohio State University Columbus', 'Oklahoma State University Stillwater', 'Oregon State University Corvallis'],
  PSU: ['Pennsylvania State University University Park', 'Portland State University Oregon'],
  RU:  ['Rutgers University New Brunswick New Jersey', 'Rice University Houston Texas'],
  SU:  ['Syracuse University New York', 'Seattle University Washington'],
  UM:  ['University of Michigan Ann Arbor', 'University of Miami Coral Gables', 'University of Memphis Tennessee', 'University of Minnesota Twin Cities', 'University of Montana Missoula'],
  USC: ['University of Southern California Los Angeles', 'University of South Carolina Columbia'],
  WSU: ['Washington State University Pullman', 'Wichita State University Kansas', 'Wayne State University Detroit Michigan', 'Weber State University Ogden Utah', 'Wright State University Dayton Ohio'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UNIVERSITIES BY STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── Alabama ───────────────────────────────────────────────────────────────
  UA:           'University of Alabama Tuscaloosa',
  UAB:          'University of Alabama at Birmingham',
  UAH:          'University of Alabama in Huntsville',
  AUM:          'Auburn University at Montgomery Alabama',
  USA:          'University of South Alabama Mobile',
  AAMU:         'Alabama A&M University Normal',
  ALABAMASTATE: 'Alabama State University Montgomery',
  TROY:         'Troy University Alabama',
  UWA:          'University of West Alabama Livingston',
  TUSKEGEE:     'Tuskegee University Alabama',

  // ── Alaska ────────────────────────────────────────────────────────────────
  UAA:  'University of Alaska Anchorage',
  UAF:  'University of Alaska Fairbanks',
  UAS:  'University of Alaska Southeast Juneau',

  // ── Arizona ───────────────────────────────────────────────────────────────
  ASU:  'Arizona State University Tempe',
  UAZ:  'University of Arizona Tucson',
  NAU:  'Northern Arizona University Flagstaff',
  GCU:  'Grand Canyon University Phoenix',

  // ── Arkansas ──────────────────────────────────────────────────────────────
  UARK:   'University of Arkansas Fayetteville',
  UALR:   'University of Arkansas Little Rock',
  UAFS:   'University of Arkansas Fort Smith',
  ASTATE: 'Arkansas State University Jonesboro',
  ATU:    'Arkansas Tech University Russellville',
  OBU:    'Ouachita Baptist University Arkadelphia Arkansas',

  // ── California ────────────────────────────────────────────────────────────
  UCLA:     'University of California Los Angeles',
  UCB:      'University of California Berkeley',
  UCSD:     'University of California San Diego',
  UCSB:     'University of California Santa Barbara',
  UCSC:     'University of California Santa Cruz',
  UCI:      'University of California Irvine',
  UCR:      'University of California Riverside',
  UCM:      'University of California Merced',
  CALTECH:  'California Institute of Technology Pasadena',
  SFSU:     'San Francisco State University',
  SJSU:     'San Jose State University',
  CSULB:    'California State University Long Beach',
  CSUF:     'California State University Fullerton',
  CSUN:     'California State University Northridge',
  CSULA:    'California State University Los Angeles',
  CSUSB:    'California State University San Bernardino',
  CSUEB:    'California State University East Bay Hayward',
  CSUDH:    'California State University Dominguez Hills',
  CSUMB:    'California State University Monterey Bay Seaside',
  CSUCHICO: 'California State University Chico',
  CSUSM:    'California State University San Marcos',
  CSUB:     'California State University Bakersfield',
  CPP:      'Cal Poly Pomona California',
  CPSLO:    'Cal Poly San Luis Obispo California',
  LMU:      'Loyola Marymount University Los Angeles',
  SCU:      'Santa Clara University California',
  USFCA:    'University of San Francisco California',

  // ── Colorado ──────────────────────────────────────────────────────────────
  CUB:      'University of Colorado Boulder',
  UCCS:     'University of Colorado Colorado Springs',
  UCDENVER: 'University of Colorado Denver',
  DU:       'University of Denver Colorado',
  MINES:    'Colorado School of Mines Golden',
  CSUP:     'Colorado State University Pueblo',
  UNCO:     'University of Northern Colorado Greeley',

  // ── Connecticut ───────────────────────────────────────────────────────────
  UCONN:       'University of Connecticut Storrs',
  CCSU:        'Central Connecticut State University New Britain',
  SCSU:        'Southern Connecticut State University New Haven',
  WCSU:        'Western Connecticut State University Danbury',
  EASTCONN:    'Eastern Connecticut State University Willimantic',
  SACREDHEART: 'Sacred Heart University Fairfield Connecticut',

  // ── Delaware ──────────────────────────────────────────────────────────────
  UD:  'University of Delaware Newark',
  DSU: 'Delaware State University Dover',

  // ── Florida ───────────────────────────────────────────────────────────────
  UCF:   'University of Central Florida Orlando',
  UF:    'University of Florida Gainesville',
  FSU:   'Florida State University Tallahassee',
  FAU:   'Florida Atlantic University Boca Raton',
  FIU:   'Florida International University Miami',
  USF:   'University of South Florida Tampa',
  FGCU:  'Florida Gulf Coast University Fort Myers',
  FIT:   'Florida Institute of Technology Melbourne Florida',
  FAMU:  'Florida A&M University Tallahassee',
  UNF:   'University of North Florida Jacksonville',
  UWF:   'University of West Florida Pensacola',
  NSU:   'Nova Southeastern University Fort Lauderdale',
  ERAU:  'Embry-Riddle Aeronautical University Daytona Beach',
  BCU:   'Bethune-Cookman University Daytona Beach',

  // ── Georgia ───────────────────────────────────────────────────────────────
  UGA:      'University of Georgia Athens',
  GT:       'Georgia Institute of Technology Atlanta',
  GASTATE:  'Georgia State University Atlanta',
  KENNESAW: 'Kennesaw State University Georgia',
  GCSU:     'Georgia College and State University Milledgeville',
  VALDOSTA: 'Valdosta State University Georgia',
  SCAD:     'Savannah College of Art and Design',
  GSOUTH:   'Georgia Southern University Statesboro',
  SPELMAN:  'Spelman College Atlanta Georgia',
  MOREHOUSE:'Morehouse College Atlanta Georgia',
  EMORY:    'Emory University Atlanta Georgia',

  // ── Hawaii ────────────────────────────────────────────────────────────────
  UHM:  'University of Hawaii at Manoa Honolulu',
  UHH:  'University of Hawaii at Hilo',
  UHWO: 'University of Hawaii West Oahu Kapolei',
  HPU:  'Hawaii Pacific University Honolulu',

  // ── Idaho ─────────────────────────────────────────────────────────────────
  UI:         'University of Idaho Moscow Idaho',
  BSU:        'Boise State University',
  IDAHOSTATE: 'Idaho State University Pocatello',
  LCSC:       'Lewis-Clark State College Idaho',

  // ── Illinois ──────────────────────────────────────────────────────────────
  UIUC:          'University of Illinois Urbana-Champaign',
  UIC:           'University of Illinois Chicago',
  UIS:           'University of Illinois Springfield',
  NIU:           'Northern Illinois University DeKalb',
  SIU:           'Southern Illinois University Carbondale',
  SIUE:          'Southern Illinois University Edwardsville',
  ILLINOISSTATE: 'Illinois State University Normal Illinois',
  IIT:           'Illinois Institute of Technology Chicago',

  // ── Indiana ───────────────────────────────────────────────────────────────
  IU:           'Indiana University Bloomington',
  IUPUI:        'Indiana University Purdue University Indianapolis',
  IPFW:         'Indiana University Purdue University Fort Wayne',
  PURDUE:       'Purdue University West Lafayette Indiana',
  PNW:          'Purdue University Northwest Hammond Indiana',
  BALLSTATE:    'Ball State University Muncie Indiana',
  INDIANASTATE: 'Indiana State University Terre Haute',
  UE:           'University of Evansville Indiana',
  USI:          'University of Southern Indiana Evansville',
  UINDY:        'University of Indianapolis',

  // ── Iowa ──────────────────────────────────────────────────────────────────
  IOWA:  'University of Iowa Iowa City',
  UNI:   'University of Northern Iowa Cedar Falls',
  DRAKE: 'Drake University Des Moines Iowa',

  // ── Kansas ────────────────────────────────────────────────────────────────
  KU:     'University of Kansas Lawrence',
  KSTATE: 'Kansas State University Manhattan Kansas',
  ESU:    'Emporia State University Kansas',
  FHSU:   'Fort Hays State University Hays Kansas',
  PSK:    'Pittsburg State University Kansas',

  // ── Kentucky ─────────────────────────────────────────────────────────────
  UK:            'University of Kentucky Lexington',
  UOFL:          'University of Louisville Kentucky',
  WKU:           'Western Kentucky University Bowling Green',
  EKU:           'Eastern Kentucky University Richmond Kentucky',
  NKU:           'Northern Kentucky University Highland Heights',
  MURRAYSTATE:   'Murray State University Murray Kentucky',
  MOREHEADSTATE: 'Morehead State University Kentucky',
  KYSTATE:       'Kentucky State University Frankfort',

  // ── Louisiana ─────────────────────────────────────────────────────────────
  LSU:      'Louisiana State University Baton Rouge',
  UNO:      'University of New Orleans Louisiana',
  SELU:     'Southeastern Louisiana University Hammond',
  LATECH:   'Louisiana Tech University Ruston',
  ULL:      'University of Louisiana Lafayette',
  ULM:      'University of Louisiana Monroe',
  SUBR:     'Southern University Baton Rouge Louisiana',
  XULA:     'Xavier University of Louisiana New Orleans',
  GRAMBLING:'Grambling State University Louisiana',
  TULANE:   'Tulane University New Orleans Louisiana',

  // ── Maine ────────────────────────────────────────────────────────────────
  UMAINE:'University of Maine Orono',
  USME:  'University of Southern Maine Portland',
  UMF:   'University of Maine Farmington',
  UMA:   'University of Maine Augusta',

  // ── Maryland ─────────────────────────────────────────────────────────────
  UMD:       'University of Maryland College Park',
  UMCP:      'University of Maryland College Park',
  UMBC:      'University of Maryland Baltimore County',
  JHU:       'Johns Hopkins University Baltimore',
  MORGAN:    'Morgan State University Baltimore',
  COPPIN:    'Coppin State University Baltimore',
  BOWIE:     'Bowie State University Maryland',
  TOWSON:    'Towson University Maryland',
  SALISBURY: 'Salisbury University Maryland',

  // ── Massachusetts ─────────────────────────────────────────────────────────
  MIT:         'Massachusetts Institute of Technology Cambridge',
  UMASS:       'University of Massachusetts Amherst',
  UMASSB:      'University of Massachusetts Boston',
  UMASSD:      'University of Massachusetts Dartmouth',
  UMASSL:      'University of Massachusetts Lowell',
  WPI:         'Worcester Polytechnic Institute Worcester Massachusetts',
  BRIDGEWATER: 'Bridgewater State University Massachusetts',
  FRAMINGHAM:  'Framingham State University Massachusetts',
  FITCHBURG:   'Fitchburg State University Massachusetts',
  MCLA:        'Massachusetts College of Liberal Arts North Adams',
  MASSART:     'Massachusetts College of Art and Design Boston',
  SALEMMA:     'Salem State University Massachusetts',
  WESTFIELD:   'Westfield State University Massachusetts',

  // ── Michigan ─────────────────────────────────────────────────────────────
  UMICH:     'University of Michigan Ann Arbor',
  EMU:       'Eastern Michigan University Ypsilanti',
  WMU:       'Western Michigan University Kalamazoo',
  NMU:       'Northern Michigan University Marquette',
  MTU:       'Michigan Technological University Houghton',
  CENTRALMI: 'Central Michigan University Mount Pleasant',
  GVSU:      'Grand Valley State University Allendale Michigan',
  WAYNE:     'Wayne State University Detroit Michigan',
  FERRIS:    'Ferris State University Big Rapids Michigan',

  // ── Minnesota ─────────────────────────────────────────────────────────────
  UMN:       'University of Minnesota Twin Cities Minneapolis',
  UMNDULUTH: 'University of Minnesota Duluth',
  MSUM:      'Minnesota State University Moorhead',
  MNSTATE:   'Minnesota State University Mankato',
  STCLOUD:   'St Cloud State University Minnesota',
  BEMIDJI:   'Bemidji State University Minnesota',
  UST:       'University of St Thomas St Paul Minnesota',
  AUGSBURG:  'Augsburg University Minneapolis Minnesota',

  // ── Mississippi ───────────────────────────────────────────────────────────
  OLEMISS:     'University of Mississippi Oxford',
  MSSTATE:     'Mississippi State University Starkville',
  SOUTHERNMS:  'University of Southern Mississippi Hattiesburg',
  JACKSONSTATE:'Jackson State University Mississippi',
  DELTASTATE:  'Delta State University Cleveland Mississippi',
  MUW:         'Mississippi University for Women Columbus Mississippi',
  MVSU:        'Mississippi Valley State University Itta Bena',

  // ── Missouri ─────────────────────────────────────────────────────────────
  MIZZOU:  'University of Missouri Columbia',
  MU:      'University of Missouri Columbia',
  UMSL:    'University of Missouri St Louis',
  UMKC:    'University of Missouri Kansas City',
  MOSTATE: 'Missouri State University Springfield',
  TRUMAN:  'Truman State University Kirksville Missouri',
  SEMO:    'Southeast Missouri State University Cape Girardeau',
  NWMSU:   'Northwest Missouri State University Maryville',
  WASHU:   'Washington University in St Louis',
  SLU:     'Saint Louis University',
  MST:     'Missouri University of Science and Technology Rolla',

  // ── Montana ───────────────────────────────────────────────────────────────
  UMT:     'University of Montana Missoula',
  MTSTATE: 'Montana State University Bozeman',
  MONTECH: 'Montana Technological University Butte',

  // ── Nebraska ─────────────────────────────────────────────────────────────
  UNL:       'University of Nebraska Lincoln',
  UNOMAHA:   'University of Nebraska Omaha',
  UNK:       'University of Nebraska Kearney',
  CREIGHTON: 'Creighton University Omaha Nebraska',

  // ── Nevada ────────────────────────────────────────────────────────────────
  UNLV: 'University of Nevada Las Vegas',
  UNR:  'University of Nevada Reno',
  NSC:  'Nevada State College Henderson Nevada',

  // ── New Hampshire ─────────────────────────────────────────────────────────
  UNH:           'University of New Hampshire Durham',
  KEENE:         'Keene State College New Hampshire',
  PLYMOUTHSTATE: 'Plymouth State University New Hampshire',

  // ── New Jersey ────────────────────────────────────────────────────────────
  RUTGERS:   'Rutgers University New Brunswick New Jersey',
  NJIT:      'New Jersey Institute of Technology Newark',
  MONTCLAIR: 'Montclair State University New Jersey',
  ROWAN:     'Rowan University Glassboro New Jersey',
  KEAN:      'Kean University Union New Jersey',
  TCNJ:      'The College of New Jersey Ewing',
  SETON:     'Seton Hall University South Orange New Jersey',
  RIDER:     'Rider University Lawrenceville New Jersey',
  STEVENS:   'Stevens Institute of Technology Hoboken New Jersey',

  // ── New Mexico ────────────────────────────────────────────────────────────
  UNM:  'University of New Mexico Albuquerque',
  NMSU: 'New Mexico State University Las Cruces',
  NMT:  'New Mexico Institute of Mining and Technology Socorro',
  ENMU: 'Eastern New Mexico University Portales',
  WNMU: 'Western New Mexico University Silver City',
  NMHU: 'New Mexico Highlands University Las Vegas New Mexico',

  // ── New York ─────────────────────────────────────────────────────────────
  NYU:        'New York University',
  CORNELL:    'Cornell University Ithaca New York',
  COLUMBIA:   'Columbia University New York City',
  UPENN:      'University of Pennsylvania Philadelphia',
  RPI:        'Rensselaer Polytechnic Institute Troy New York',
  RIT:        'Rochester Institute of Technology Rochester New York',
  LIU:        'Long Island University',
  STONYBROOK: 'Stony Brook University New York',
  BINGHAMTON: 'Binghamton University SUNY',
  SUNYALBANY: 'University at Albany SUNY',
  SUNYBUFFALO:'University at Buffalo SUNY',
  NEWPALTZ:   'SUNY New Paltz',
  OSWEGO:     'SUNY Oswego',
  GENESEO:    'SUNY Geneseo',
  ONEONTA:    'SUNY Oneonta',
  BROCKPORT:  'SUNY Brockport',
  PLATTSBURGH:'SUNY Plattsburgh',
  CORTLAND:   'SUNY Cortland',
  FREDONIA:   'SUNY Fredonia',
  PURCHASE:   'SUNY Purchase',
  CLARKSON:   'Clarkson University Potsdam New York',
  MARIST:     'Marist College Poughkeepsie New York',
  PRATT:      'Pratt Institute Brooklyn',
  PACE:       'Pace University New York',
  FORDHAM:    'Fordham University Bronx New York',
  STJOHNS:    'St Johns University Jamaica Queens New York',
  HOFSTRA:    'Hofstra University Hempstead Long Island',
  ADELPHI:    'Adelphi University Garden City New York',

  // ── North Carolina ────────────────────────────────────────────────────────
  UNC:      'University of North Carolina Chapel Hill',
  NCSU:     'North Carolina State University Raleigh',
  NCSTATE:  'North Carolina State University Raleigh',
  ECU:      'East Carolina University Greenville North Carolina',
  UNCC:     'University of North Carolina Charlotte',
  UNCG:     'University of North Carolina Greensboro',
  UNCW:     'University of North Carolina Wilmington',
  APPSTATE: 'Appalachian State University Boone North Carolina',
  WCU:      'Western Carolina University Cullowhee',
  NCAT:     'North Carolina A&T State University Greensboro',
  NCCU:     'North Carolina Central University Durham',
  ELON:     'Elon University North Carolina',
  DAVIDSON: 'Davidson College North Carolina',
  HIGHPOINT:'High Point University North Carolina',
  CAMPBELL: 'Campbell University Buies Creek North Carolina',

  // ── North Dakota ──────────────────────────────────────────────────────────
  UND:         'University of North Dakota Grand Forks',
  NDSU:        'North Dakota State University Fargo',
  MINOTSTATE:  'Minot State University North Dakota',
  DICKINSONND: 'Dickinson State University North Dakota',
  VCSU:        'Valley City State University North Dakota',

  // ── Ohio ──────────────────────────────────────────────────────────────────
  OHIOU:          'Ohio University Athens Ohio',
  UC:             'University of Cincinnati Ohio',
  MIAMIOH:        'Miami University Oxford Ohio',
  CLEVELANDSTATE: 'Cleveland State University Ohio',
  YSU:            'Youngstown State University Youngstown Ohio',
  BGSU:           'Bowling Green State University Ohio',
  TOLEDO:         'University of Toledo Ohio',
  KENTSTATE:      'Kent State University Kent Ohio',
  AKRON:          'University of Akron Ohio',
  WRIGHT:         'Wright State University Dayton Ohio',
  XAVIER:         'Xavier University Cincinnati Ohio',

  // ── Oklahoma ─────────────────────────────────────────────────────────────
  OU:      'University of Oklahoma Norman',
  OKSTATE: 'Oklahoma State University Stillwater',
  TU:      'University of Tulsa Oklahoma',
  UCO:     'University of Central Oklahoma Edmond',
  ORU:     'Oral Roberts University Tulsa Oklahoma',

  // ── Oregon ────────────────────────────────────────────────────────────────
  UO:           'University of Oregon Eugene',
  OREGONSTATE:  'Oregon State University Corvallis',
  PORTLANDSTATE:'Portland State University Oregon',
  SOU:          'Southern Oregon University Ashland',
  EOU:          'Eastern Oregon University La Grande',
  WOU:          'Western Oregon University Monmouth',

  // ── Pennsylvania ─────────────────────────────────────────────────────────
  PENNSTATE:       'Pennsylvania State University University Park',
  PITT:            'University of Pittsburgh',
  UPITT:           'University of Pittsburgh',
  CMU:             'Carnegie Mellon University Pittsburgh',
  TEMPLE:          'Temple University Philadelphia',
  DREXEL:          'Drexel University Philadelphia',
  VILLANOVA:       'Villanova University Villanova Pennsylvania',
  LEHIGH:          'Lehigh University Bethlehem Pennsylvania',
  DUQUESNE:        'Duquesne University Pittsburgh',
  IUP:             'Indiana University of Pennsylvania',
  MILLERSVILLE:    'Millersville University Pennsylvania',
  SHIPPENSBURG:    'Shippensburg University Pennsylvania',
  WESTCHESTER:     'West Chester University Pennsylvania',
  BLOOMSBURG:      'Bloomsburg University Pennsylvania',
  KUTZTOWN:        'Kutztown University Pennsylvania',
  EASTSTROUDSBURG: 'East Stroudsburg University Pennsylvania',
  SLIPPERYROCK:    'Slippery Rock University Pennsylvania',
  SJU:             'Saint Josephs University Philadelphia',
  CHEYNEY:         'Cheyney University Pennsylvania',

  // ── Rhode Island ──────────────────────────────────────────────────────────
  URI:       'University of Rhode Island Kingston',
  RICOLLEGE: 'Rhode Island College Providence',
  RISD:      'Rhode Island School of Design Providence',
  RWU:       'Roger Williams University Bristol Rhode Island',
  JWU:       'Johnson and Wales University Providence Rhode Island',

  // ── South Carolina ────────────────────────────────────────────────────────
  UOSC:    'University of South Carolina Columbia',
  CLEMSON: 'Clemson University South Carolina',
  COC:     'College of Charleston South Carolina',
  CCU:     'Coastal Carolina University Conway South Carolina',
  SCSTATE: 'South Carolina State University Orangeburg',
  WINTHROP:'Winthrop University Rock Hill South Carolina',
  FMU:     'Francis Marion University Florence South Carolina',
  USCA:    'University of South Carolina Aiken',

  // ── South Dakota ─────────────────────────────────────────────────────────
  USD:         'University of South Dakota Vermillion',
  SDSU:        'South Dakota State University Brookings',
  SDMT:        'South Dakota Mines Rapid City',
  NORTHERNSD:  'Northern State University Aberdeen South Dakota',
  BHSU:        'Black Hills State University Spearfish South Dakota',
  AUGUSTANASD: 'Augustana University Sioux Falls South Dakota',

  // ── Tennessee ─────────────────────────────────────────────────────────────
  UTK:      'University of Tennessee Knoxville',
  MTSU:     'Middle Tennessee State University Murfreesboro',
  TSU:      'Tennessee State University Nashville',
  ETSU:     'East Tennessee State University Johnson City',
  APSU:     'Austin Peay State University Clarksville Tennessee',
  UTC:      'University of Tennessee Chattanooga',
  MEMPHIS:  'University of Memphis Tennessee',
  TNTECH:   'Tennessee Technological University Cookeville',
  VANDERBILT:'Vanderbilt University Nashville Tennessee',
  FISK:     'Fisk University Nashville Tennessee',

  // ── Texas ─────────────────────────────────────────────────────────────────
  UT:      'University of Texas Austin',
  UTAUSTIN:'University of Texas Austin',
  TAMU:    'Texas A&M University College Station',
  TTU:     'Texas Tech University Lubbock',
  UH:      'University of Houston',
  UTSA:    'University of Texas at San Antonio',
  UTEP:    'University of Texas at El Paso',
  UTD:     'University of Texas at Dallas Richardson',
  UTA:     'University of Texas at Arlington',
  UTRGV:   'University of Texas Rio Grande Valley Edinburg',
  TCU:     'Texas Christian University Fort Worth',
  SMU:     'Southern Methodist University Dallas',
  SFA:     'Stephen F Austin State University Nacogdoches Texas',
  SHSU:    'Sam Houston State University Huntsville Texas',
  TWU:     'Texas Womans University Denton',
  TXSTATE: 'Texas State University San Marcos',
  WTAMU:   'West Texas A&M University Canyon Texas',
  TAMUC:   'Texas A&M University Commerce',
  TAMUK:   'Texas A&M University Kingsville',
  PVAMU:   'Prairie View A&M University Texas',
  HBU:     'Houston Baptist University',
  LCU:     'Lubbock Christian University Texas',
  ACU:     'Abilene Christian University Texas',
  TARLETON:'Tarleton State University Stephenville Texas',
  TXSOUTH: 'Texas Southern University Houston',
  UIW:     'University of the Incarnate Word San Antonio',
  UTTYLER: 'University of Texas Tyler',
  TAMUSA:  'Texas A&M University San Antonio',
  TAMCC:   'Texas A&M University Corpus Christi',
  LAMAR:   'Lamar University Beaumont Texas',
  STMARYS: 'St Marys University San Antonio Texas',
  RICE:    'Rice University Houston Texas',

  // ── Utah ──────────────────────────────────────────────────────────────────
  UTAH:  'University of Utah Salt Lake City',
  UU:    'University of Utah Salt Lake City',
  USU:   'Utah State University Logan Utah',
  BYU:   'Brigham Young University Provo Utah',
  WEBER: 'Weber State University Ogden Utah',
  SUU:   'Southern Utah University Cedar City',
  UVU:   'Utah Valley University Orem Utah',
  SLCC:  'Salt Lake Community College Utah',
  DIXIE: 'Dixie State University St George Utah',

  // ── Vermont ───────────────────────────────────────────────────────────────
  UVM: 'University of Vermont Burlington',

  // ── Virginia ─────────────────────────────────────────────────────────────
  UVA:          'University of Virginia Charlottesville',
  VT:           'Virginia Tech Blacksburg Virginia',
  GMU:          'George Mason University Fairfax Virginia',
  ODU:          'Old Dominion University Norfolk Virginia',
  JMU:          'James Madison University Harrisonburg Virginia',
  VCU:          'Virginia Commonwealth University Richmond Virginia',
  WM:           'College of William and Mary Williamsburg Virginia',
  VMI:          'Virginia Military Institute Lexington Virginia',
  CNU:          'Christopher Newport University Newport News Virginia',
  UMW:          'University of Mary Washington Fredericksburg Virginia',
  VASTATE:      'Virginia State University Petersburg',
  NORFOLKSTATE: 'Norfolk State University Norfolk Virginia',
  LIBERTY:      'Liberty University Lynchburg Virginia',
  HAMPTON:      'Hampton University Virginia',

  // ── Washington ────────────────────────────────────────────────────────────
  UW:      'University of Washington Seattle',
  WSUWA:   'Washington State University Pullman Washington',
  WWU:     'Western Washington University Bellingham',
  EWU:     'Eastern Washington University Cheney',
  CWU:     'Central Washington University Ellensburg',
  SPU:     'Seattle Pacific University Seattle',
  GONZAGA: 'Gonzaga University Spokane',
  PLU:     'Pacific Lutheran University Tacoma',

  // ── West Virginia ─────────────────────────────────────────────────────────
  WVU:      'West Virginia University Morgantown',
  MARSHALL: 'Marshall University Huntington West Virginia',
  SHEPHERD: 'Shepherd University Shepherdstown West Virginia',
  FAIRMONT: 'Fairmont State University West Virginia',
  WLU:      'West Liberty University West Virginia',

  // ── Wisconsin ─────────────────────────────────────────────────────────────
  UWMADISON:  'University of Wisconsin Madison',
  UWM:        'University of Wisconsin Milwaukee',
  UWGB:       'University of Wisconsin Green Bay',
  UWO:        'University of Wisconsin Oshkosh',
  UWEC:       'University of Wisconsin Eau Claire',
  UWRF:       'University of Wisconsin River Falls',
  UWP:        'University of Wisconsin Platteville',
  UWSP:       'University of Wisconsin Stevens Point',
  UWL:        'University of Wisconsin La Crosse',
  UWS:        'University of Wisconsin Superior',
  UWSTOUT:    'University of Wisconsin Stout Menomonie',
  UWW:        'University of Wisconsin Whitewater',
  UWPARKSIDE: 'University of Wisconsin Parkside Kenosha',
  MARQUETTE:  'Marquette University Milwaukee Wisconsin',

  // ── Wyoming ───────────────────────────────────────────────────────────────
  UWYO: 'University of Wyoming Laramie',

  // ── Washington DC ─────────────────────────────────────────────────────────
  GWU:       'George Washington University Washington DC',
  AMERICAN:  'American University Washington DC',
  CUA:       'Catholic University of America Washington DC',
  GALLAUDET: 'Gallaudet University Washington DC',
  UDC:       'University of the District of Columbia Washington DC',
  HOWARD:    'Howard University Washington DC',
  GEORGETOWN:'Georgetown University Washington DC',

  // ──────────────────────────────────────────────────────────────────────────
  // HOSPITALS BY STATE
  // (acronyms that are commonly used but Mapbox cannot resolve without expansion)
  // ──────────────────────────────────────────────────────────────────────────

  // Alabama
  UABH:      'UAB Hospital Birmingham Alabama',
  CHILDRENSALA: 'Children\'s of Alabama Birmingham',

  // Alaska
  PAMC:  'Providence Alaska Medical Center Anchorage',

  // Arizona
  BANNERAZ:  'Banner University Medical Center Phoenix Arizona',
  MAYOAZ:    'Mayo Clinic Hospital Phoenix Arizona',
  PHOENIXCH: 'Phoenix Children\'s Hospital Arizona',

  // Arkansas
  UAMS: 'University of Arkansas for Medical Sciences Medical Center Little Rock',

  // California
  CHLA:  'Children\'s Hospital Los Angeles',
  RADY:  'Rady Children\'s Hospital San Diego',
  UCSF:  'UCSF Medical Center San Francisco',
  CEDARS:'Cedars-Sinai Medical Center Los Angeles',
  STANFORDHEALTH: 'Stanford Health Care Palo Alto California',

  // Colorado
  CHCO:     'Children\'s Hospital Colorado Aurora',
  UCHEALTH: 'UCHealth University of Colorado Hospital Aurora',

  // Connecticut
  YNHH: 'Yale New Haven Hospital Connecticut',
  HH:   'Hartford Hospital Connecticut',

  // Delaware
  CHRISTIANA: 'ChristianaCare Wilmington Delaware',
  NEMOURS:    'Nemours Children\'s Hospital Delaware',

  // Florida
  JMH:        'Jackson Memorial Hospital Miami Florida',
  TGH:        'Tampa General Hospital Florida',
  SHANDS:     'UF Health Shands Gainesville Florida',
  ADVENTHEALTH: 'AdventHealth Orlando Florida',
  MAYOJAX:    'Mayo Clinic Jacksonville Florida',
  NCH:        'Nicklaus Children\'s Hospital Miami',

  // Georgia
  GRADY:  'Grady Memorial Hospital Atlanta Georgia',
  EUH:    'Emory University Hospital Atlanta Georgia',
  CHOA:   'Children\'s Healthcare of Atlanta',

  // Hawaii
  QMC: 'Queens Medical Center Honolulu Hawaii',

  // Idaho
  STLUKES:  'St Lukes Regional Medical Center Boise Idaho',
  STALPHONS:'St Alphonsus Regional Medical Center Boise Idaho',

  // Illinois
  NMH:  'Northwestern Memorial Hospital Chicago Illinois',
  RUSH: 'Rush University Medical Center Chicago Illinois',
  LUMC: 'Loyola University Medical Center Maywood Illinois',

  // Indiana
  IUH:     'Indiana University Health Indianapolis',
  ESKENAZI:'Eskenazi Health Indianapolis Indiana',

  // Iowa
  UIHC: 'University of Iowa Hospitals and Clinics Iowa City',

  // Kansas
  KUMC: 'University of Kansas Medical Center Kansas City Kansas',

  // Kentucky
  UKHC:   'UK Healthcare Lexington Kentucky',
  NORTON: 'Norton Healthcare Louisville Kentucky',

  // Louisiana
  OCHSNER: 'Ochsner Health New Orleans Louisiana',
  LSUHSC:  'LSU Health Sciences Center New Orleans Louisiana',

  // Maine
  MMC:  'Maine Medical Center Portland Maine',
  EMMC: 'Eastern Maine Medical Center Bangor Maine',

  // Maryland
  JHH:  'Johns Hopkins Hospital Baltimore Maryland',
  UMMC: 'University of Maryland Medical Center Baltimore',

  // Massachusetts
  MGH:    'Massachusetts General Hospital Boston',
  BWH:    'Brigham and Womens Hospital Boston',
  BRIGHAM:'Brigham and Womens Hospital Boston',
  BCH:    'Boston Children\'s Hospital Massachusetts',
  BIDMC:  'Beth Israel Deaconess Medical Center Boston',
  BMC:    'Boston Medical Center Massachusetts',

  // Michigan
  UMICHMED: 'Michigan Medicine University of Michigan Health Ann Arbor',
  HFH:      'Henry Ford Hospital Detroit Michigan',
  BEAUMONT: 'Beaumont Health Royal Oak Michigan',
  CHILDRENSMI: 'Children\'s Hospital of Michigan Detroit',

  // Minnesota
  MAYO:     'Mayo Clinic Rochester Minnesota',
  MHEALTH:  'M Health Fairview University of Minnesota Minneapolis',
  ALLINAMN: 'Allina Health Minneapolis Minnesota',

  // Mississippi
  MISSUMC: 'University of Mississippi Medical Center Jackson',

  // Missouri
  BJH:   'Barnes-Jewish Hospital St Louis Missouri',
  MERCY: 'Mercy Hospital St Louis Missouri',

  // Montana
  BILLINGS:'Billings Clinic Montana',
  STPATS:  'Providence St Patricks Hospital Missoula Montana',

  // Nebraska
  UNMC:     'University of Nebraska Medical Center Omaha',
  NEBMEDCTR:'Nebraska Medicine Omaha Nebraska',
  CHILDRENSNE: 'Children\'s Hospital and Medical Center Omaha Nebraska',

  // Nevada
  RENOWN:  'Renown Regional Medical Center Reno Nevada',
  UMCSN:   'University Medical Center of Southern Nevada Las Vegas',
  VALLEYH: 'Valley Hospital Medical Center Las Vegas Nevada',

  // New Hampshire
  DHMC: 'Dartmouth Hitchcock Medical Center Lebanon New Hampshire',

  // New Jersey
  RWJUH:     'Robert Wood Johnson University Hospital New Brunswick New Jersey',
  HACKENSACK:'Hackensack University Medical Center New Jersey',
  UHNJ:      'University Hospital Newark New Jersey',

  // New Mexico
  UNMH:   'University of New Mexico Hospital Albuquerque',
  PRESNM: 'Presbyterian Hospital Albuquerque New Mexico',

  // New York
  NYP:        'NewYork-Presbyterian Hospital New York',
  MSKCC:      'Memorial Sloan Kettering Cancer Center New York',
  MOUNTSINAI: 'Mount Sinai Hospital New York',
  MONTEFIORE: 'Montefiore Medical Center Bronx New York',
  CHONY:      'NewYork-Presbyterian Morgan Stanley Children\'s Hospital',
  BELLEVUE:   'Bellevue Hospital Center New York',

  // North Carolina
  DUH:    'Duke University Hospital Durham North Carolina',
  UNCH:   'UNC Hospitals Chapel Hill North Carolina',
  ATRIUM: 'Atrium Health Charlotte North Carolina',
  WAKEMEDH: 'WakeMed Hospital Raleigh North Carolina',

  // North Dakota
  SANFORDND: 'Sanford Health Fargo North Dakota',
  ESSENTIAND:'Essentia Health Fargo North Dakota',

  // Ohio
  CCF:     'Cleveland Clinic Cleveland Ohio',
  OSUMC:   'Ohio State University Wexner Medical Center Columbus',
  CCHMC:   'Cincinnati Children\'s Hospital Medical Center Ohio',
  RAINBOWOH:'Rainbow Babies and Children\'s Hospital Cleveland Ohio',
  AKRONCH: 'Akron Children\'s Hospital Ohio',

  // Oklahoma
  OUHEALTH: 'OU Health Science Center Oklahoma City Oklahoma',
  STFRANCIS:'St Francis Hospital Tulsa Oklahoma',

  // Oregon
  OHSU: 'Oregon Health and Science University Portland Oregon',

  // Pennsylvania
  UPMC:      'University of Pittsburgh Medical Center Pennsylvania',
  JEFFERSON: 'Jefferson Health Philadelphia Pennsylvania',
  TUH:       'Temple University Hospital Philadelphia Pennsylvania',
  CHOP:      'Children\'s Hospital of Philadelphia Pennsylvania',
  GEISINGER: 'Geisinger Medical Center Danville Pennsylvania',

  // Rhode Island
  RIH: 'Rhode Island Hospital Providence Rhode Island',
  WIH: 'Women and Infants Hospital Providence Rhode Island',

  // South Carolina
  MUSC:   'Medical University of South Carolina Charleston',
  PRISMA: 'Prisma Health Greenville South Carolina',

  // South Dakota
  SANFORDSD:'Sanford USD Medical Center Sioux Falls South Dakota',
  AVERA:    'Avera McKennan Hospital Sioux Falls South Dakota',

  // Tennessee
  VUMC:    'Vanderbilt University Medical Center Nashville Tennessee',
  UTMC:    'University of Tennessee Medical Center Knoxville Tennessee',
  LEBONHEUR:'Le Bonheur Children\'s Hospital Memphis Tennessee',

  // Texas
  MDACC: 'MD Anderson Cancer Center Houston Texas',
  MDA:   'MD Anderson Cancer Center Houston Texas',
  UTSW:  'UT Southwestern Medical Center Dallas Texas',
  TCH:   'Texas Children\'s Hospital Houston Texas',
  HMH:   'Houston Methodist Hospital Texas',
  TMC:   'Texas Medical Center Houston Texas',
  COOK:  'Cook Children\'s Medical Center Fort Worth Texas',

  // Utah
  INTERMOUNTAIN:'Intermountain Medical Center Murray Utah',
  UUH:          'University of Utah Hospital Salt Lake City Utah',

  // Vermont
  UVMMC: 'University of Vermont Medical Center Burlington Vermont',

  // Virginia
  VCUMC:  'VCU Medical Center Richmond Virginia',
  INOVA:  'Inova Fairfax Hospital Falls Church Virginia',
  SENTARA:'Sentara Norfolk General Hospital Virginia',
  UVAHEALTH:'UVA Health University of Virginia Charlottesville',

  // Washington
  UWMC:  'UW Medical Center Seattle Washington',
  SCH:   'Seattle Children\'s Hospital Washington',
  SWEDISH:'Swedish Medical Center Seattle Washington',

  // West Virginia
  WVUMED: 'WVU Medicine Morgantown West Virginia',
  CAMC:   'Charleston Area Medical Center West Virginia',

  // Wisconsin
  UWHEALTH:  'UW Health University Hospital Madison Wisconsin',
  FROEDTERT: 'Froedtert Hospital Milwaukee Wisconsin',
  CHWISC:    'Children\'s Wisconsin Hospital Milwaukee',

  // Wyoming
  WMC: 'Wyoming Medical Center Casper Wyoming',

  // ──────────────────────────────────────────────────────────────────────────
  // NATIONAL PARKS — NPS four-letter codes used by hikers, campers, and park enthusiasts
  // ──────────────────────────────────────────────────────────────────────────

  // Iconic big parks
  YELL: 'Yellowstone National Park Wyoming',
  GRCA: 'Grand Canyon National Park Arizona',
  YOSE: 'Yosemite National Park California',
  ROMO: 'Rocky Mountain National Park Colorado',
  RMNP: 'Rocky Mountain National Park Colorado',
  ZION: 'Zion National Park Utah',
  BRCA: 'Bryce Canyon National Park Utah',
  ARCH: 'Arches National Park Utah',
  CANY: 'Canyonlands National Park Utah',
  GRTE: 'Grand Teton National Park Wyoming',
  GLAC: 'Glacier National Park Montana',
  EVER: 'Everglades National Park Florida',
  ACAD: 'Acadia National Park Maine',
  SHEN: 'Shenandoah National Park Virginia',
  GRSM: 'Great Smoky Mountains National Park Tennessee',
  OLYM: 'Olympic National Park Washington',
  MORA: 'Mount Rainier National Park Washington',
  CRLA: 'Crater Lake National Park Oregon',
  DENA: 'Denali National Park Alaska',
  KEFJ: 'Kenai Fjords National Park Alaska',
  HALE: 'Haleakala National Park Maui Hawaii',
  HAVO: 'Hawaii Volcanoes National Park Big Island Hawaii',

  // Southwest parks
  BIBE: 'Big Bend National Park Texas',
  CAVE: 'Carlsbad Caverns National Park New Mexico',
  GUMO: 'Guadalupe Mountains National Park Texas',
  MEVE: 'Mesa Verde National Park Colorado',
  PEFO: 'Petrified Forest National Park Arizona',
  CORO: 'Coronado National Memorial Arizona',

  // California parks
  REDW: 'Redwood National and State Parks California',
  JOTR: 'Joshua Tree National Park California',
  PINN: 'Pinnacles National Park California',
  SEKI: 'Sequoia National Park California',
  KICA: 'Kings Canyon National Park California',
  CHIS: 'Channel Islands National Park California',
  LAVO: 'Lassen Volcanic National Park California',
  PORE: 'Point Reyes National Seashore California',

  // Pacific Northwest
  NOCA: 'North Cascades National Park Washington',
  CRMO: 'Crater of the Moon National Monument Idaho',

  // Midwest and Great Plains
  BADL: 'Badlands National Park South Dakota',
  WICA: 'Wind Cave National Park South Dakota',
  THRO: 'Theodore Roosevelt National Park North Dakota',
  VOYA: 'Voyageurs National Park Minnesota',
  ISRO: 'Isle Royale National Park Michigan',
  CUVA: 'Cuyahoga Valley National Park Ohio',

  // East and South
  HOSP: 'Hot Springs National Park Arkansas',
  NERI: 'New River Gorge National Park West Virginia',
  CONG: 'Congaree National Park South Carolina',
  BISC: 'Biscayne National Park Florida',
  DRTO: 'Dry Tortugas National Park Florida',
  CAHA: 'Cape Hatteras National Seashore North Carolina',
  CAIS: 'Cape Canaveral National Seashore Florida',

  // ──────────────────────────────────────────────────────────────────────────
  // THEME PARKS & AMUSEMENT PARKS BY STATE
  // ──────────────────────────────────────────────────────────────────────────

  // Alabama
  MATTCENTER: 'McWane Science Center Birmingham Alabama',

  // California
  SFMM:    'Six Flags Magic Mountain Valencia California',
  KNOTTS:  'Knotts Berry Farm Buena Park California',
  DLAND:   'Disneyland Anaheim California',
  DLCA:    'Disney California Adventure Anaheim',
  USSA:    'Universal Studios Hollywood California',
  SEAWORLD_SD:'SeaWorld San Diego California',
  LEGOLANDCA:'Legoland California Carlsbad',

  // Colorado
  ELITCH: 'Elitch Gardens Denver Colorado',
  GLENWOOD:'Glenwood Caverns Adventure Park Colorado',

  // Florida
  WDW:    'Walt Disney World Orlando Florida',
  EPCOT:  'EPCOT Walt Disney World Orlando Florida',
  HS:     'Disney Hollywood Studios Orlando Florida',
  AK:     'Animal Kingdom Walt Disney World Orlando Florida',
  MK:     'Magic Kingdom Walt Disney World Orlando Florida',
  USO:    'Universal Studios Orlando Florida',
  IOA:    'Islands of Adventure Universal Orlando Florida',
  BGT:    'Busch Gardens Tampa Florida',
  SWO:    'SeaWorld Orlando Florida',
  LEGOLANDFL:'Legoland Florida Winter Haven',
  ICON:   'ICON Park Orlando Florida',

  // Georgia
  SFOG: 'Six Flags Over Georgia Austell',
  WHITEWATERGA: 'White Water Atlanta Georgia',

  // Illinois
  SFGAM: 'Six Flags Great America Gurnee Illinois',

  // Maryland
  SIXFLAGS_MD: 'Six Flags America Upper Marlboro Maryland',

  // Massachusetts
  SFNE: 'Six Flags New England Agawam Massachusetts',

  // Missouri
  SFSTL:   'Six Flags St Louis Eureka Missouri',
  SDC:     'Silver Dollar City Branson Missouri',
  BRANSON: 'Silver Dollar City Branson Missouri',

  // New Jersey
  SFGA: 'Six Flags Great Adventure Jackson New Jersey',
  SAML: 'Sahara Sam\'s Oasis Water Park West Berlin New Jersey',

  // New York
  SFGA_NY: 'Six Flags Great Escape Lake George New York',

  // Ohio
  CP:   'Cedar Point Sandusky Ohio',
  KI:   'Kings Island Mason Ohio',
  SFIO: 'Six Flags Worlds of Adventure Aurora Ohio',

  // Pennsylvania
  HERSHEY:  'Hersheypark Hershey Pennsylvania',
  KNOEBELS: 'Knoebels Amusement Resort Elysburg Pennsylvania',
  DORNEY:   'Dorney Park Allentown Pennsylvania',

  // Tennessee
  DOLLYWOOD:'Dollywood Pigeon Forge Tennessee',
  DOLLYSPLASH:'Dollywood Splash Country Pigeon Forge Tennessee',
  OPRYLAND:'Opryland Nashville Tennessee',

  // Texas
  SFOT:   'Six Flags Over Texas Arlington Texas',
  SFFT:   'Six Flags Fiesta Texas San Antonio',
  SFHB:   'Six Flags Hurricane Harbor Arlington Texas',
  ASTROWORLD: 'Six Flags Astroworld Houston Texas',
  SCHLITTERBAHN: 'Schlitterbahn New Braunfels Texas',
  SCHLITTERBAHN_GB: 'Schlitterbahn Galveston Texas',
  MOODY: 'Moody Gardens Galveston Texas',

  // Virginia
  BGW:  'Busch Gardens Williamsburg Virginia',
  KD:   'Kings Dominion Doswell Virginia',
  WATERPARK_VA: 'Water Country USA Williamsburg Virginia',

  // Wisconsin
  DELLS: 'Wisconsin Dells Wisconsin',
  WD:    'Wisconsin Dells Wisconsin',
  NOAHS: 'Noah\'s Ark Water Park Wisconsin Dells',

  // Kansas
  WORLDS: 'Worlds of Fun Kansas City Missouri',

  // ──────────────────────────────────────────────────────────────────────────
  // POPULAR SPOTS & LANDMARKS BY STATE
  // ──────────────────────────────────────────────────────────────────────────

  // Alabama
  USSPACECAMP: 'US Space and Rocket Center Huntsville Alabama',
  USSALA:      'USS Alabama Battleship Memorial Park Mobile Alabama',

  // Alaska
  DENALI:  'Denali National Park and Preserve Alaska',
  AURORA:  'Aurora Ice Museum Fairbanks Alaska',

  // Arizona
  SEDONA:    'Sedona Arizona',
  ANTELOPE:  'Antelope Canyon Arizona',
  HORSESHOE: 'Horseshoe Bend Glen Canyon Arizona',

  // Arkansas
  CRYSTALBRIDGES: 'Crystal Bridges Museum of American Art Bentonville Arkansas',
  WHITEHALL:      'Crater of Diamonds State Park Arkansas',

  // California
  GGB:    'Golden Gate Bridge San Francisco California',
  ALCATRAZ:'Alcatraz Island San Francisco California',
  PIER39: 'Pier 39 San Francisco California',
  SM:     'Santa Monica Pier California',
  GRIFFITH:'Griffith Observatory Los Angeles California',
  HWALK:  'Hollywood Walk of Fame Los Angeles California',
  GETTY:  'Getty Center Los Angeles California',

  // Colorado
  GARDENOFGODS: 'Garden of the Gods Colorado Springs Colorado',
  PIKESPEAK:    'Pikes Peak Colorado Springs Colorado',
  REDROCKS:     'Red Rocks Amphitheatre Morrison Colorado',
  MANITOU:      'Manitou Incline Colorado Springs Colorado',

  // Connecticut
  MYSTICSEAPORT: 'Mystic Seaport Museum Connecticut',
  MYSTICAQ:      'Mystic Aquarium Connecticut',

  // Delaware
  REHOBEACH: 'Rehoboth Beach Delaware',
  DEWEYBEACH:'Dewey Beach Delaware',

  // Florida
  KEYWEST:     'Key West Florida',
  SOUTHBEACH:  'South Beach Miami Beach Florida',
  CLEARWTRBEACH:'Clearwater Beach Florida',
  STPETEBEACH: 'St Pete Beach Florida',
  DAYTONABEACH:'Daytona Beach Florida',
  NAPLESFLA:   'Naples Beach Florida',
  SANIBEL:     'Sanibel Island Florida',
  CAPECANAVERAL:'Kennedy Space Center Visitor Complex Cape Canaveral Florida',
  KSC:         'Kennedy Space Center Visitor Complex Cape Canaveral Florida',
  STAUGUSTINE: 'St Augustine Historic District Florida',
  EVERGLADES:  'Everglades National Park Florida',
  SIESTA:      'Siesta Key Beach Sarasota Florida',
  PENSACOLABEACH:'Pensacola Beach Florida',
  ORLANDOEYDR: 'Orlando Eye International Drive Florida',

  // Georgia
  STMTN:    'Stone Mountain Park Georgia',
  BELTLINE: 'Atlanta BeltLine Trail Georgia',
  COBBTIX:  'Cobb County Georgia',
  CENTOLYM: 'Centennial Olympic Park Atlanta Georgia',
  GABAY:    'Golden Isles Georgia',
  SAVGARDEN:'Forsyth Park Savannah Georgia',

  // Hawaii
  PEARLHARBOR:'Pearl Harbor National Memorial Honolulu Hawaii',
  WAIKIKI:    'Waikiki Beach Honolulu Hawaii',
  NORTHSHORE: 'North Shore Oahu Hawaii',
  HANAUMA:    'Hanauma Bay Nature Preserve Hawaii',
  NAPALI:     'Na Pali Coast State Wilderness Park Kauai Hawaii',
  RDBCH:      'Red Sand Beach Hana Maui Hawaii',
  RDSLIDE:    'Road to Hana Maui Hawaii',

  // Idaho
  SUNVALLEY:  'Sun Valley Resort Idaho',
  SNAKERIVER: 'Snake River Birds of Prey National Conservation Area Idaho',
  SAWTOOTH:   'Sawtooth National Recreation Area Idaho',

  // Illinois
  NAVYPIER:  'Navy Pier Chicago Illinois',
  BEAN:      'Cloud Gate Millennium Park Chicago Illinois',
  THEBEAN:   'Cloud Gate Millennium Park Chicago Illinois',
  WILLIS:    'Willis Tower Chicago Illinois',
  SHEDD:     'Shedd Aquarium Chicago Illinois',
  FIELDMUSEUM:'Field Museum Chicago Illinois',
  AIC:       'Art Institute of Chicago Illinois',

  // Indiana
  INDY500:  'Indianapolis Motor Speedway Indiana',
  IMS:      'Indianapolis Motor Speedway Indiana',
  INDIANADUNES: 'Indiana Dunes National Park Indiana',
  HOLIDAYWORLD: 'Holiday World Santa Claus Indiana',

  // Iowa
  FIELDOFDREAMS:'Field of Dreams Movie Site Dyersville Iowa',

  // Kansas
  FLINTHILLS:   'Flint Hills National Scenic Byway Kansas',
  TALLGRASS:    'Tallgrass Prairie National Preserve Kansas',

  // Kentucky
  MAMMOTHCAVE:  'Mammoth Cave National Park Kentucky',
  CHURCHILLDOWNS:'Churchill Downs Louisville Kentucky',
  HORSEPARKKY:  'Kentucky Horse Park Lexington Kentucky',
  MAMMOTH:      'Mammoth Cave National Park Kentucky',

  // Louisiana
  FRENCHQUARTER:'French Quarter New Orleans Louisiana',
  BOURBON:      'Bourbon Street New Orleans Louisiana',
  NOLA:         'New Orleans Louisiana',
  MARDIGRASWORLD:'Mardi Gras World New Orleans Louisiana',
  AUDUBON:      'Audubon Zoo New Orleans Louisiana',
  GARDENDIST:   'Garden District New Orleans Louisiana',

  // Maine
  BARHARBOR:    'Bar Harbor Maine',
  ACADIA:       'Acadia National Park Maine',
  PORTLANDME:   'Portland Old Port Maine',
  KENNEBUNKPORT:'Kennebunkport Maine',

  // Maryland
  INNERHARB:    'Inner Harbor Baltimore Maryland',
  OCMD:         'Ocean City Maryland',
  NATIONALHARBOR:'National Harbor Oxon Hill Maryland',
  FDHILL:       'Fort McHenry National Monument Baltimore Maryland',

  // Massachusetts
  CAPECOD:      'Cape Cod Massachusetts',
  MARTHASVINEYARD: 'Marthas Vineyard Massachusetts',
  NANTUCKET:    'Nantucket Massachusetts',
  FREEDOMTRAIL: 'Freedom Trail Boston Massachusetts',
  PLYMOUTHROCK: 'Plymouth Rock Massachusetts',
  SALEMMA2:     'Salem Massachusetts',
  FENWAY:       'Fenway Park Boston Massachusetts',

  // Michigan
  MACKINAC:     'Mackinac Island Michigan',
  SLEEPINGBEAR: 'Sleeping Bear Dunes National Lakeshore Michigan',
  PUREMICHIGAN: 'Pictured Rocks National Lakeshore Michigan',
  PICTUREDROCKS:'Pictured Rocks National Lakeshore Michigan',
  MOTOWN:       'Motown Museum Detroit Michigan',

  // Minnesota
  MOA:          'Mall of America Bloomington Minnesota',
  MALLOFAMERICA:'Mall of America Bloomington Minnesota',
  MINNEHAHA:    'Minnehaha Falls Minneapolis Minnesota',
  BWCAW:        'Boundary Waters Canoe Area Wilderness Minnesota',
  BOUNDARY:     'Boundary Waters Canoe Area Wilderness Minnesota',

  // Mississippi
  NATCHEZ:      'Natchez Trace Parkway Mississippi',
  VICKSBURG:    'Vicksburg National Military Park Mississippi',

  // Missouri
  ARCHSTL:      'Gateway Arch St Louis Missouri',
  GATEWAYARCH:  'Gateway Arch National Park St Louis Missouri',
  LAKEOFOZKRK: 'Lake of the Ozarks Missouri',

  // Montana
  GLACIERNP:   'Glacier National Park Montana',
  BIGSKY:      'Big Sky Resort Montana',
  YELLOWSTONEENT:'Yellowstone National Park North Entrance Gardiner Montana',

  // Nebraska
  CHIMNEYROCK: 'Chimney Rock National Historic Site Nebraska',
  HDOORLY:     'Henry Doorly Zoo Omaha Nebraska',

  // Nevada
  VEGASSTRIP: 'Las Vegas Strip Nevada',
  STRIP:      'Las Vegas Strip Nevada',
  HOOVERSDAM: 'Hoover Dam Boulder City Nevada',
  REDROCKSNV: 'Red Rock Canyon National Conservation Area Nevada',
  STRATOSPHERE:'Strat Hotel Casino Las Vegas Nevada',
  AREA51:     'Extraterrestrial Highway Rachel Nevada',

  // New Hampshire
  WHITEMTNS:   'White Mountain National Forest New Hampshire',
  MTWASHINGTON:'Mount Washington New Hampshire',

  // New Jersey
  ASBURY:      'Asbury Park New Jersey',
  CAPEMAY:     'Cape May New Jersey',
  OCNJ:        'Ocean City New Jersey',
  BOARDWALK:   'Atlantic City Boardwalk New Jersey',
  LIBERTYST:   'Liberty State Park Jersey City New Jersey',

  // New Mexico
  WHITESANDS:  'White Sands National Park New Mexico',
  CARLSBAD:    'Carlsbad Caverns National Park New Mexico',
  OLDTOWNABQ:  'Old Town Albuquerque New Mexico',
  TAOS:        'Taos New Mexico',
  SANTAFEPL:   'Santa Fe Plaza New Mexico',

  // New York
  TIMESSQUARE:'Times Square New York City',
  CENTRALPARK:'Central Park New York City',
  SOL:         'Statue of Liberty New York',
  ESB:         'Empire State Building New York City',
  HIGHLINE:    'High Line Park New York City',
  BROOKLYNBR:  'Brooklyn Bridge New York City',
  NIAGARA:     'Niagara Falls New York',
  NIAGARAFALLS:'Niagara Falls New York',
  CONEY:       'Coney Island Brooklyn New York',

  // North Carolina
  OBX:     'Outer Banks North Carolina',
  OUTERBANKS:'Outer Banks North Carolina',
  BILTMORE:'Biltmore Estate Asheville North Carolina',
  BLUERIDGE:'Blue Ridge Parkway North Carolina',
  WRIGHTBROTHERS: 'Wright Brothers National Memorial Kitty Hawk North Carolina',

  // North Dakota
  TRNP:   'Theodore Roosevelt National Park North Dakota',
  BADLANDSND:'Theodore Roosevelt National Park North Dakota',

  // Ohio
  RRHOF:   'Rock and Roll Hall of Fame Cleveland Ohio',
  RNRHOF:  'Rock and Roll Hall of Fame Cleveland Ohio',
  PFHOF:   'Pro Football Hall of Fame Canton Ohio',

  // Oklahoma
  OKCMEMORIAL: 'Oklahoma City National Memorial and Museum Oklahoma',
  ROUTEK66:    'Route 66 Oklahoma',

  // Oregon
  MULTNOMAH:   'Multnomah Falls Bridal Veil Oregon',
  CRATERLK:    'Crater Lake National Park Oregon',
  COLUMBIAGORGE:'Columbia River Gorge Oregon',
  CANNON:      'Cannon Beach Oregon',
  PORTHAY:     'Haystack Rock Cannon Beach Oregon',

  // Pennsylvania
  LIBERTYBELL: 'Liberty Bell Center Philadelphia Pennsylvania',
  INDEPHALL:   'Independence Hall Philadelphia Pennsylvania',
  GETTYSBURG:  'Gettysburg National Military Park Pennsylvania',
  STEELYARDS:  'Heinz Field Pittsburgh Pennsylvania',
  FALLINGWATER:'Fallingwater Mill Run Pennsylvania',

  // Rhode Island
  CLIFFWALK:  'Cliff Walk Newport Rhode Island',
  NEWPORTRI:  'Newport Rhode Island',
  GOOSEWING:  'Goosewing Beach Preserve Rhode Island',

  // South Carolina
  MYRTLEBEACH:'Myrtle Beach South Carolina',
  HILTONHEAD: 'Hilton Head Island South Carolina',
  FORTSUMT:   'Fort Sumter National Monument Charleston South Carolina',
  CHASWA:     'Charleston South Carolina',

  // South Dakota
  MTRUSHMR:   'Mount Rushmore National Memorial South Dakota',
  MTRUSHMORE: 'Mount Rushmore National Memorial South Dakota',
  CRAZYHORSE: 'Crazy Horse Memorial Custer South Dakota',
  WALLDRUG:   'Wall Drug Wall South Dakota',
  BADLANDSSD: 'Badlands National Park South Dakota',

  // Tennessee
  GRANDOLEOPRY:'Grand Ole Opry Nashville Tennessee',
  OPRY:        'Grand Ole Opry Nashville Tennessee',
  CMHOF:       'Country Music Hall of Fame Nashville Tennessee',
  GRACELAND:   'Graceland Memphis Tennessee',
  GSMNPTN:     'Great Smoky Mountains National Park Gatlinburg Tennessee',
  GATLINBURG:  'Gatlinburg Tennessee',

  // Texas
  RIVERSWALK: 'San Antonio River Walk Texas',
  RIVERWALK:  'San Antonio River Walk Texas',
  ALAMO:      'The Alamo San Antonio Texas',
  HOUSTZON:   'Houston Zoo Texas',
  SIXST:      'Sixth Street Austin Texas',
  AUSTINCT:   'Austin City Limits Music Center Texas',
  PADRE:      'South Padre Island Texas',
  SPADRE:     'South Padre Island Texas',
  SPACECENTERTX:'Space Center Houston Texas',

  // Utah
  ARCHNP:     'Arches National Park Moab Utah',
  MOAB:       'Moab Utah',
  MONUMENTVALLEY:'Monument Valley Navajo Tribal Park Utah',
  SALTFLATS:  'Bonneville Salt Flats Utah',
  CANYONLANDS:'Canyonlands National Park Moab Utah',
  ZIONNP:     'Zion National Park Springdale Utah',
  PARKCIE:    'Park City Utah',
  BRYCE:      'Bryce Canyon National Park Utah',

  // Vermont
  STOWEVT:   'Stowe Mountain Resort Vermont',
  BNJERRY:   'Ben and Jerrys Factory Tour Waterbury Vermont',
  SHELBURNE: 'Shelburne Farms Vermont',

  // Virginia
  COLONIALWB:'Colonial Williamsburg Virginia',
  VABCH:     'Virginia Beach Virginia',
  OCMD_VA:   'Chincoteague National Wildlife Refuge Virginia',
  MANASSAS:  'Manassas National Battlefield Park Virginia',
  QUANTICO:  'National Museum of the Marine Corps Triangle Virginia',
  SKYLINE:   'Skyline Drive Shenandoah National Park Virginia',

  // Washington
  PIKEPLCMKT:'Pike Place Market Seattle Washington',
  SPACENEEDLE:'Space Needle Seattle Washington',
  MOUNTRANIER:'Mount Rainier National Park Washington',
  OLMPIC:    'Olympic National Park Washington',
  SANJISL:   'San Juan Islands Washington',
  LEAVENWORTH:'Leavenworth Washington',

  // West Virginia
  HARPERSFY: 'Harpers Ferry National Historical Park West Virginia',
  NRGORGE:   'New River Gorge National Park West Virginia',
  SNOWSHOE:  'Snowshoe Mountain Resort West Virginia',

  // Wisconsin
  CHICAGOLAND:'Lake Geneva Wisconsin',
  LAKEGENE:  'Lake Geneva Wisconsin',
  HOUSEROCK: 'House on the Rock Spring Green Wisconsin',
  MILWAUKEEARTMUSEUM: 'Milwaukee Art Museum Wisconsin',

  // Wyoming
  GRANDTETON: 'Grand Teton National Park Wyoming',
  JACKSONHOLE:'Jackson Hole Wyoming',
  JACKSON:   'Jackson Wyoming',
  OLDFAHFUL: 'Old Faithful Geyser Yellowstone Wyoming',
  OLDFAITHFUL:'Old Faithful Geyser Yellowstone Wyoming',
  CODYWY:    'Cody Wyoming',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAJOR SPORTS VENUES & ARENAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MSG:       'Madison Square Garden New York City',
  WRIGLEY:   'Wrigley Field Chicago Illinois',
  YANKEE:    'Yankee Stadium Bronx New York',
  LAMBEAU:   'Lambeau Field Green Bay Wisconsin',
  GILLETTEST:'Gillette Stadium Foxborough Massachusetts',
  SOFI:      'SoFi Stadium Inglewood California',
  ATTSTD:    'AT&T Stadium Arlington Texas',
  CAMDEN:    'Oriole Park at Camden Yards Baltimore Maryland',
  ORACLE:    'Oracle Park San Francisco California',
  PETCO:     'Petco Park San Diego California',
  CHASE:     'Chase Field Phoenix Arizona',
  COORS:     'Coors Field Denver Colorado',
  GUARDIAN:  'Progressive Field Cleveland Ohio',
  GREATAMER: 'Great American Ball Park Cincinnati Ohio',
  BUSCH:     'Busch Stadium St Louis Missouri',
  TRUIST:    'Truist Park Cumberland Georgia',
  MINUTE:    'Minute Maid Park Houston Texas',
  GLOBELIFE: 'Globe Life Field Arlington Texas',
  NISSAN:    'Nissan Stadium Nashville Tennessee',
  BANKUNITED:'Hard Rock Stadium Miami Gardens Florida',
  AMALIE:    'Amalie Arena Tampa Florida',
  KASEYA:    'Kaseya Center Miami Florida',
  UNITED:    'United Center Chicago Illinois',
  STAPLESCTR:'Crypto.com Arena Los Angeles California',
  CRYPTOARENA:'Crypto.com Arena Los Angeles California',
  BALLYCTR:  'Bally Center Phoenix Arizona',
  SPECTRUM:  'Spectrum Center Charlotte North Carolina',
  BARCLAYS:  'Barclays Center Brooklyn New York',
  PRUDENTIAL:'Prudential Center Newark New Jersey',
  WELLSFARGO:'Wells Fargo Center Philadelphia Pennsylvania',
  BRIDGESTONE:'Bridgestone Arena Nashville Tennessee',
  VIVENT:    'Delta Center Salt Lake City Utah',
  DELTACTR:  'Delta Center Salt Lake City Utah',
  ENTERPRISE:'Enterprise Center St Louis Missouri',
  GAINBRIDGE: 'Gainbridge Fieldhouse Indianapolis Indiana',
  ROCKET:    'Rocket Mortgage FieldHouse Cleveland Ohio',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAJOR AIRPORTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MCO:  'Orlando International Airport',
  TPA:  'Tampa International Airport',
  FLL:  'Fort Lauderdale Hollywood International Airport',
  PBI:  'Palm Beach International Airport Florida',
  RSW:  'Southwest Florida International Airport Fort Myers',
  JAX:  'Jacksonville International Airport Florida',
  SRQ:  'Sarasota Bradenton International Airport',
  TLH:  'Tallahassee International Airport',
  EWR:  'Newark Liberty International Airport New Jersey',
  LGA:  'LaGuardia Airport New York',
  JFK:  'John F Kennedy International Airport New York',
  BOS:  'Logan International Airport Boston',
  IAD:  'Washington Dulles International Airport',
  DCA:  'Reagan National Airport Washington DC',
  BWI:  'Baltimore Washington International Airport',
  ORD:  "O'Hare International Airport Chicago",
  MDW:  'Midway International Airport Chicago',
  DTW:  'Detroit Metropolitan Wayne County Airport',
  MSP:  'Minneapolis Saint Paul International Airport',
  STL:  'St Louis Lambert International Airport',
  MCI:  'Kansas City International Airport',
  DFW:  'Dallas Fort Worth International Airport',
  DAL:  'Dallas Love Field Airport',
  IAH:  'George Bush Intercontinental Airport Houston',
  HOU:  'William P Hobby Airport Houston Texas',
  SAT:  'San Antonio International Airport Texas',
  AUS:  'Austin-Bergstrom International Airport Texas',
  SLC:  'Salt Lake City International Airport Utah',
  DEN:  'Denver International Airport Colorado',
  PHX:  'Phoenix Sky Harbor International Airport',
  LAS:  'Harry Reid International Airport Las Vegas',
  LAX:  'Los Angeles International Airport',
  SFO:  'San Francisco International Airport',
  SJC:  'San Jose International Airport California',
  OAK:  'Oakland International Airport California',
  SEA:  'Seattle-Tacoma International Airport',
  PDX:  'Portland International Airport Oregon',
  ATL:  'Hartsfield-Jackson Atlanta International Airport',
  MIA:  'Miami International Airport Florida',
  CLT:  'Charlotte Douglas International Airport',
  PHL:  'Philadelphia International Airport',
  MSY:  'Louis Armstrong New Orleans International Airport',
  MEM:  'Memphis International Airport Tennessee',
  BNA:  'Nashville International Airport Tennessee',
  CVG:  'Cincinnati Northern Kentucky International Airport',
  CMH:  'John Glenn Columbus International Airport Ohio',
  CLE:  'Cleveland Hopkins International Airport Ohio',
  PIT:  'Pittsburgh International Airport Pennsylvania',
  RDU:  'Raleigh Durham International Airport North Carolina',
  BDL:  'Bradley International Airport Windsor Locks Connecticut',
  PVD:  'T F Green Airport Providence Rhode Island',
  BUF:  'Buffalo Niagara International Airport New York',
  ROC:  'Greater Rochester International Airport New York',
  ALB:  'Albany International Airport New York',
  SYR:  'Syracuse Hancock International Airport New York',
  BTV:  'Burlington International Airport Vermont',
  PWM:  'Portland International Jetport Maine',
  MHT:  'Manchester Boston Regional Airport New Hampshire',
  ORF:  'Norfolk International Airport Virginia',
  RIC:  'Richmond International Airport Virginia',
  CHS:  'Charleston International Airport South Carolina',
  SAV:  'Savannah Hilton Head International Airport Georgia',
  GSP:  'Greenville Spartanburg International Airport South Carolina',
  BHM:  'Birmingham-Shuttlesworth International Airport Alabama',
  HSV:  'Huntsville International Airport Alabama',
  MOB:  'Mobile Regional Airport Alabama',
  LIT:  'Bill and Hillary Clinton National Airport Little Rock Arkansas',
  TUL:  'Tulsa International Airport Oklahoma',
  OKC:  'Will Rogers World Airport Oklahoma City',
  MKE:  'Milwaukee Mitchell International Airport Wisconsin',
  MSN:  'Dane County Regional Airport Madison Wisconsin',
  DSM:  'Des Moines International Airport Iowa',
  OMA:  'Eppley Airfield Omaha Nebraska',
  ICT:  'Wichita Dwight D Eisenhower National Airport Kansas',
  ABQ:  'Albuquerque International Sunport New Mexico',
  ELP:  'El Paso International Airport Texas',
  TUS:  'Tucson International Airport Arizona',
  BOI:  'Boise Airport Idaho',
  BZN:  'Bozeman Yellowstone International Airport Montana',
  GEG:  'Spokane International Airport Washington',
  SMF:  'Sacramento International Airport California',
  SNA:  'John Wayne Airport Orange County California',
  LGB:  'Long Beach Airport California',
  BUR:  'Hollywood Burbank Airport California',
  ONT:  'Ontario International Airport California',
  FAT:  'Fresno Yosemite International Airport California',
  RNO:  'Reno-Tahoe International Airport Nevada',
  HNL:  'Daniel K Inouye International Airport Honolulu',
  OGG:  'Kahului Airport Maui Hawaii',
  KOA:  'Ellison Onizuka Kona International Airport Hawaii',
  ANC:  'Ted Stevens Anchorage International Airport Alaska',
  FAI:  'Fairbanks International Airport Alaska',
}

export function expandAcronym(query) {
  const q = query.trim()
  return ACRONYMS[q] ?? ACRONYMS[q.toUpperCase()] ?? null
}
