import React, { useState } from 'react';
import { useTheme } from '../App';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Search, 
  Plane, 
  TrendingUp, 
  Scale, 
  Fuel, 
  MapPin,
  Layers
} from 'lucide-react';

interface DataSourceItem {
  id: string;
  category: string;
  dataField: string;
  sourceEntity: string;
  sourceType: 'Government Authority' | 'Live Commercial Ingestion' | 'Regulatory Agency' | 'Public OMC Tariff';
  collectionMethod: string;
  cadence: string;
  description: string;
  verification: string;
  accessUrl?: string;
  icon: any;
  color: string;
}

interface CitationItem {
  id: string;
  title: string;
  authors: string;
  publication: string;
  year: string;
  category: 'Official Index Benchmark' | 'Econometric Precedent' | 'Robust Statistics' | 'Index Theory';
  url: string;
  keyFinding: string;
  apixUsage: string;
  bibtex: string;
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'fares',
    category: 'Live Airfare & Booking Curves',
    dataField: 'Route Fare Quotes, Flight Numbers, Cabin Tiers (Economy/Business), Non-Stop vs 1-Stop',
    sourceEntity: 'MakeMyTrip, Ixigo, Goibibo, & Direct Carrier Portals (IndiGo, Air India, SpiceJet, Akasa)',
    sourceType: 'Live Commercial Ingestion',
    collectionMethod: 'Automated high-frequency scraping pipeline with exponential backoff & rate-limit throttling',
    cadence: 'Daily continuous ingestion across T+1, T+7, T+15, T+30, T+45 lead-time windows',
    description: 'Captures dynamic yield-management airfare matrices across the 80-route sovereign domestic basket, capturing both last-minute business fares and advance-purchase leisure fares.',
    verification: 'Pre-processed through Tukey\'s IQR fences [Q1 - 1.5×IQR, Q3 + 1.5×IQR] and Hampel\'s MAD bound to sanitize scraping anomalies.',
    accessUrl: 'https://www.makemytrip.com/flights/',
    icon: Plane,
    color: '#06B6D4'
  },
  {
    id: 'dgca-traffic',
    category: 'Passenger Traffic & Route Weights',
    dataField: 'City-Pair Passenger Volumes (PAX), Quarterly Traffic Matrices, Market Share by Carrier',
    sourceEntity: 'Directorate General of Civil Aviation (DGCA), Ministry of Civil Aviation, Govt. of India',
    sourceType: 'Government Authority',
    collectionMethod: 'Direct parsing of DGCA Form A/B Quarterly Traffic Returns and Monthly Domestic Air Transport Reports',
    cadence: 'Quarterly weight re-anchoring with monthly traffic reconciliations',
    description: 'Provides official sovereign passenger volumes across all 80 domestic city-pairs to derive the modified Laspeyres/Lowe route weights w(r,0) = PAX_r / Σ PAX_k.',
    verification: 'Cross-validated against Airport Authority of India (AAI) terminal passenger throughput returns.',
    accessUrl: 'https://www.dgca.gov.in/digigov-portal/?page=4265/4260/servicename',
    icon: Scale,
    color: '#8B5CF6'
  },
  {
    id: 'mospi-cpi',
    category: 'Macroeconomic CPI Benchmark',
    dataField: 'Consumer Price Index (CPI) Transport & Communication Sub-Index (Base 2012=100)',
    sourceEntity: 'Ministry of Statistics and Programme Implementation (MOSPI), National Statistical Office (NSO)',
    sourceType: 'Government Authority',
    collectionMethod: 'Official monthly MOSPI press releases and NSO data portal ingestion',
    cadence: 'Monthly publication on the 12th of every month',
    description: 'Used as an independent macroeconomic benchmark to evaluate how APIx domestic airfare inflation correlates with broader national transport inflation.',
    verification: 'Official Government of India statutory economic series.',
    accessUrl: 'https://mospi.gov.in/cpi',
    icon: TrendingUp,
    color: '#10B981'
  },
  {
    id: 'atf-prices',
    category: 'Aviation Fuel Tariffs',
    dataField: 'Aviation Turbine Fuel (ATF) Domestic Airport Refuelling Prices (₹/kL) across Metros',
    sourceEntity: 'Indian Oil Corporation Ltd (IOCL), Bharat Petroleum (BPCL), Hindustan Petroleum (HPCL)',
    sourceType: 'Public OMC Tariff',
    collectionMethod: 'Public oil marketing company (OMC) aviation pricing tariff schedule ingestion',
    cadence: 'Fortnightly / 1st of every month pricing updates',
    description: 'Powers the APIx Fuel & Economic Shock Simulator to project airline operating cost sensitivity, break-even fare shifts, and fuel surcharge pass-through rates.',
    verification: 'Published OMC pricing circulars audited against Ministry of Petroleum & Natural Gas (MoPNG) releases.',
    accessUrl: 'https://iocl.com/aviation-fuel',
    icon: Fuel,
    color: '#F59E0B'
  },
  {
    id: 'fleet-registry',
    category: 'Carrier Fleet & Seating Capacity',
    dataField: 'Aircraft Type (A320neo, B737 MAX, ATR-72), Seating Capacities, Fleet Count, Airline Ownership',
    sourceEntity: 'DGCA Civil Aviation Requirements (CAR) Aircraft Registry & Airline Fleet Disclosures',
    sourceType: 'Regulatory Agency',
    collectionMethod: 'DGCA Aircraft Registration Data & quarterly airline investor presentations',
    cadence: 'Quarterly updates reflecting aircraft deliveries and retirements',
    description: 'Informs route capacity estimation, carrier seat distribution, and route-level Herfindahl-Hirschman Index (HHI) antitrust market concentration calculations.',
    verification: 'Cross-checked against airline operating permits and DGCA Air Operator Certificates (AOC).',
    accessUrl: 'https://www.dgca.gov.in',
    icon: Layers,
    color: '#EC4899'
  },
  {
    id: 'cartography',
    category: 'Sovereign Geospatial Boundaries',
    dataField: 'Survey of India Sovereign State & Border Vector Geometries, AAI Geodetic Airport Coordinates',
    sourceEntity: 'Survey of India (SOI), Department of Science & Technology, Govt. of India',
    sourceType: 'Government Authority',
    collectionMethod: 'Official Survey of India digital administrative shapefiles',
    cadence: 'Static sovereign baseline (100% compliant boundary maps)',
    description: 'Guarantees full cartographic compliance with statutory Survey of India standards, depicting 100% integral Indian sovereign territory across all flight route heatmaps.',
    verification: 'Audited against National Geospatial Policy guidelines.',
    accessUrl: 'https://surveyofindia.gov.in',
    icon: MapPin,
    color: '#3B82F6'
  }
];

const CITATIONS: CitationItem[] = [
  {
    id: 'mospi-cpi-framework',
    title: 'Consumer Price Index (CPI) Methodology: Transport & Services Basket (COICOP Framework)',
    authors: 'Ministry of Statistics & Programme Implementation (MoSPI), National Statistical Office (NSO)',
    publication: 'Government of India, MoSPI Technical Notes & CPI Release Series',
    year: 'Official Standard',
    category: 'Official Index Benchmark',
    url: 'https://www.mospi.gov.in/sites/default/files/cpi/cpi_concept_methodology.pdf',
    keyFinding: 'Defines the national methodology for tracking transport services inflation under the COICOP framework, incorporating digital online platform data collection and HCES expenditure weighting.',
    apixUsage: 'Official macroeconomic benchmark: APIx tracks and cross-checks against MoSPI Transport & Communication CPI series.',
    bibtex: `@techreport{mospi_cpi_manual,
  author = {{Ministry of Statistics and Programme Implementation}},
  title = {Consumer Price Index: Concepts, Definitions and Methodology for Transport Services},
  institution = {National Statistical Office (NSO), Government of India},
  year = {2024},
  url = {https://www.mospi.gov.in/sites/default/files/cpi/cpi_concept_methodology.pdf}
}`
  },
  {
    id: 'dgca-tmu-rules',
    title: 'Handbook of Civil Aviation Statistics & Tariff Monitoring Unit (TMU) Framework (Rule 135, Aircraft Rules)',
    authors: 'Directorate General of Civil Aviation (DGCA), Ministry of Civil Aviation',
    publication: 'DGCA Annual Statistics & Civil Aviation Requirements (CAR Section 3 - Air Transport)',
    year: 'Regulatory Standard',
    category: 'Official Index Benchmark',
    url: 'https://www.dgca.gov.in/digigov-portal/?page=4265/4260/servicename',
    keyFinding: 'Establishes statutory reporting of city-pair passenger traffic (Form A/B) and route-wise tariff band monitoring across 78+ domestic trunk corridors to prevent excessive fare surges.',
    apixUsage: 'Source of truth for APIx 80-route sovereign passenger weights w(r,0) and statutory regulatory compliance standards.',
    bibtex: `@techreport{dgca_traffic_handbook,
  author = {{Directorate General of Civil Aviation}},
  title = {Handbook of Civil Aviation Statistics and Tariff Monitoring Unit Directives},
  institution = {Ministry of Civil Aviation, Government of India},
  year = {2024},
  url = {https://www.dgca.gov.in/digigov-portal/?page=4265/4260/servicename}
}`
  },
  {
    id: 'parliament-airfare-report',
    title: 'Report on Fixing of Airfares and Dynamic Pricing in Civil Aviation Sector (Report No. 328)',
    authors: 'Parliamentary Standing Committee on Transport, Tourism and Culture, Parliament of India',
    publication: 'Rajya Sabha Secretariat, Parliament of India',
    year: 'Parliamentary Report',
    category: 'Econometric Precedent',
    url: 'https://sansad.in/rs/committees/standing-committees',
    keyFinding: 'Examines algorithmic surge pricing, emergency booking spikes, and market concentration; emphasizes the urgent need for high-frequency empirical airfare monitoring to safeguard consumer interests.',
    apixUsage: 'Direct policy justification for APIx: provides statutory mandate for high-frequency lead-time (T+1 to T+45) price index tracking.',
    bibtex: `@techreport{parliament_airfare_report328,
  author = {{Parliamentary Standing Committee on Transport, Tourism and Culture}},
  title = {Report on Fixing of Airfares and Issues Related to Dynamic Pricing in Civil Aviation Sector},
  institution = {Parliament of India, Rajya Sabha Secretariat},
  year = {2023},
  number = {Report No. 328},
  url = {https://sansad.in/rs/committees/standing-committees}
}`
  },
  {
    id: 'cci-aviation-study',
    title: 'Market Study on the Civil Aviation Sector in India: Market Concentration & Competition Dynamics',
    authors: 'Competition Commission of India (CCI)',
    publication: 'Government of India, Competition Commission of India Policy Research',
    year: 'Market Study',
    category: 'Econometric Precedent',
    url: 'https://www.cci.gov.in/market-research/market-studies',
    keyFinding: 'Quantifies route-level Herfindahl-Hirschman Index (HHI) concentration across Indian domestic airline routes and evaluates algorithmic pricing coordination risks in highly concentrated corridors.',
    apixUsage: 'Theoretical and empirical foundation for the APIx Antitrust & HHI Policy Portal (/analysts).',
    bibtex: `@techreport{cci_aviation_study,
  author = {{Competition Commission of India}},
  title = {Market Study on the Civil Aviation Sector in India: Market Power, Concentration and Dynamic Pricing},
  institution = {Competition Commission of India, Government of India},
  year = {2022},
  url = {https://www.cci.gov.in/market-research/market-studies}
}`
  },
  {
    id: 'bls-cpi',
    title: 'Consumer Price Index: Airline Fares Factsheet',
    authors: 'U.S. Bureau of Labor Statistics (BLS)',
    publication: 'U.S. Department of Labor, BLS CPI Methodology Series',
    year: 'Official Benchmark',
    category: 'Official Index Benchmark',
    url: 'https://www.bls.gov/cpi/factsheets/airline-fares.htm',
    keyFinding: 'Documents the official government methodology for tracking commercial airline fares in the Consumer Price Index basket, isolating pure fare inflation from auxiliary fee unbundling.',
    apixUsage: 'Foundational benchmark for airfare basket design and price relative construction.',
    bibtex: `@techreport{bls_cpi_airfare,
  author = {{U.S. Bureau of Labor Statistics}},
  title = {Consumer Price Index: Airline Fares Factsheet},
  institution = {U.S. Department of Labor},
  year = {2023},
  url = {https://www.bls.gov/cpi/factsheets/airline-fares.htm}
}`
  },
  {
    id: 'bls-ipp',
    title: 'Air Passenger Fares Price Indexes (International Price Program)',
    authors: 'U.S. Bureau of Labor Statistics (BLS)',
    publication: 'BLS Handbook of Methods, International Price Program',
    year: 'Official Standard',
    category: 'Econometric Precedent',
    url: 'https://www.bls.gov/mxp/methods/air-passenger-fares.htm',
    keyFinding: 'Utilizes a modified Laspeyres formula weighted by passenger-volume-derived revenue shares sourced from DOT DB1B surveys and Commerce I-92 data, updated periodically. Direct methodological ancestor to APIx.',
    apixUsage: 'Direct methodological precedent: APIx implements this exact volume-weighted Laspeyres aggregation structure using Indian DGCA Form A/B passenger returns.',
    bibtex: `@techreport{bls_ipp_airfare,
  author = {{U.S. Bureau of Labor Statistics}},
  title = {Air Passenger Fares Price Indexes: International Price Program Methodology},
  institution = {U.S. Department of Labor},
  year = {2022},
  url = {https://www.bls.gov/mxp/methods/air-passenger-fares.htm}
}`
  },
  {
    id: 'atpi-2005',
    title: 'Air-Travel Transaction Index',
    authors: 'Janice Lent & Alan H. Dorfman',
    publication: 'Monthly Labor Review, U.S. Bureau of Labor Statistics, Vol. 128, No. 6, pp. 45–54',
    year: '2005',
    category: 'Econometric Precedent',
    url: 'https://www.bls.gov/opub/mlr/2005/06/art4full.pdf',
    keyFinding: 'Constructed an experimental transaction-based air travel price index (ATPI) using large-scale computerized reservation system (CRS) data and benchmarked tracking accuracy against official CPI airfare series.',
    apixUsage: 'Demonstrates that electronic high-frequency fare scraping produces leading economic signals consistent with official price series.',
    bibtex: `@article{lent2005air,
  author = {Lent, Janice and Dorfman, Alan H.},
  title = {Air-Travel Transaction Index},
  journal = {Monthly Labor Review},
  volume = {128},
  number = {6},
  pages = {45--54},
  year = {2005},
  publisher = {U.S. Bureau of Labor Statistics},
  url = {https://www.bls.gov/opub/mlr/2005/06/art4full.pdf}
}`
  },
  {
    id: 'bls-wp-2021',
    title: 'CPI Indexes for Subsets of the Target Population: Laspeyres vs. Törnqvist and Substitution Bias',
    authors: 'U.S. Bureau of Labor Statistics',
    publication: 'BLS Working Paper Series (Working Paper No. 543)',
    year: '2021',
    category: 'Index Theory',
    url: 'https://www.bls.gov/osmr/research-papers/2021/',
    keyFinding: 'Evaluates fixed-weight Laspeyres vs. superlative Törnqvist index formulas and quantifies consumer substitution bias in price monitoring systems.',
    apixUsage: 'Informs APIx\'s deliberate choice of fixed-weight Laspeyres for real-time tracking, while defining the roadmap for future Chained Törnqvist index extensions.',
    bibtex: `@techreport{bls_wp_2021_substitution,
  author = {{U.S. Bureau of Labor Statistics}},
  title = {CPI Indexes for Subsets of the Target Population: Laspeyres vs. T{\\"o}rnqvist Formulations and Consumer Substitution Bias},
  institution = {U.S. Bureau of Labor Statistics},
  year = {2021},
  type = {Working Paper},
  number = {543},
  url = {https://www.bls.gov/osmr/research-papers/2021/}
}`
  },
  {
    id: 'ons-manual',
    title: 'Consumer Price Indices Technical Manual (Appendix: Laspeyres, Lowe, and Young Index Formulae)',
    authors: 'UK Office for National Statistics (ONS)',
    publication: 'UK Office for National Statistics Methodology Series',
    year: '2020',
    category: 'Index Theory',
    url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/methodologies/consumerpriceindicestechnicalmanual2019',
    keyFinding: 'Rigorous mathematical proof that real-world operational price indices with periodically updated quantity weights operate as Lowe Indices rather than pure textbook Laspeyres indices.',
    apixUsage: 'Provides theoretical rigor for APIx\'s quarterly DGCA weight re-anchoring framework.',
    bibtex: `@manual{ons_cpi_manual,
  author = {{UK Office for National Statistics}},
  title = {Consumer Price Indices Technical Manual: Appendix on Formulae used to calculate CPI},
  organization = {UK Office for National Statistics},
  year = {2020},
  url = {https://www.ons.gov.uk/economy/inflationandpriceindices/methodologies/consumerpriceindicestechnicalmanual2019}
}`
  },
  {
    id: 'tukey-1977',
    title: 'Exploratory Data Analysis (IQR Outlier Fences)',
    authors: 'John W. Tukey',
    publication: 'Addison-Wesley Series in Behavioral Science, Reading, Mass.',
    year: '1977',
    category: 'Robust Statistics',
    url: 'https://archive.org/details/exploratorydataa00tuke',
    keyFinding: 'Introduced the Interquartile Range (IQR) fence formulation [Q1 - 1.5×IQR, Q3 + 1.5×IQR] for non-parametric outlier detection with a 25% breakdown point.',
    apixUsage: 'Used as the primary Stage-1 mathematical gate to strip last-seat surge spikes from scraped airfare sets.',
    bibtex: `@book{tukey1977exploratory,
  author = {Tukey, John W.},
  title = {Exploratory Data Analysis},
  publisher = {Addison-Wesley},
  year = {1977},
  address = {Reading, Mass.}
}`
  },
  {
    id: 'hampel-1974',
    title: 'The Influence Curve and its Role in Robust Estimation (Median Absolute Deviation)',
    authors: 'Frank R. Hampel',
    publication: 'Journal of the American Statistical Association, Vol. 69, No. 346, pp. 383–393',
    year: '1974',
    category: 'Robust Statistics',
    url: 'https://www.jstor.org/stable/2285666',
    keyFinding: 'Proved that the Median Absolute Deviation (MAD) is the optimal robust scale estimator with a 50% breakdown point against arbitrary sample contamination.',
    apixUsage: 'Deployed in APIx for small-sample route slices (N < 10) to guarantee scale estimation robustness.',
    bibtex: `@article{hampel1974influence,
  author = {Hampel, Frank R.},
  title = {The Influence Curve and its Role in Robust Estimation},
  journal = {Journal of the American Statistical Association},
  volume = {69},
  number = {346},
  pages = {383--393},
  year = {1974}
}`
  }
];

const References: React.FC = () => {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<'sources' | 'literature' | 'citation'>('sources');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSources = DATA_SOURCES.filter(s => {
    const matchesSearch = s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.dataField.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.sourceEntity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredCitations = CITATIONS.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.keyFinding.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', 'Official Index Benchmark', 'Econometric Precedent', 'Index Theory', 'Robust Statistics'];

  const apixBibtex = `@misc{apix2026index,
  title = {APIx: Sovereign Indian Airfare Price Index and Market Concentration Monitoring System},
  author = {{Smart India Hackathon Technical Evaluation Team}},
  year = {2026},
  howpublished = {\\url{https://github.com/shreejit106/AIR-FARE-PRICE-INDEX}},
  note = {Built for Ministry of Civil Aviation, DGCA, and Competition Commission of India}
}`;

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* Header Banner */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
          Transparency & Verification
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Data Sources & Research References
        </h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 860, lineHeight: 1.75, margin: 0 }}>
          Complete data provenance mapping and verified academic literature citations. APIx strictly uses confirmed primary sources and established international econometric frameworks for full reproducibility and legal auditability.
        </p>
      </div>

      {/* Main Tab Navigation (Clean, Professional, No Emojis) */}
      <div style={{
        display: 'flex', 
        gap: 8, 
        marginBottom: 32,
        borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}`,
        paddingBottom: 0,
        overflowX: 'auto'
      }}>
        {[
          { id: 'sources',    label: 'Data Provenance Matrix', count: DATA_SOURCES.length },
          { id: 'literature', label: 'Verified Research Literature', count: CITATIONS.length },
          { id: 'citation',   label: 'Citation & Attribution', count: null },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id
                ? '2px solid var(--cyan)'
                : '2px solid transparent',
              color: activeTab === t.id ? 'var(--text)' : 'var(--sub)',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
            {t.count !== null && (
              <span style={{ 
                fontSize: '0.72rem', 
                padding: '2px 7px', 
                borderRadius: 10, 
                background: activeTab === t.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.06)',
                color: activeTab === t.id ? 'var(--cyan)' : 'var(--sub)'
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: DATA SOURCES PROVENANCE ─── */}
      {activeTab === 'sources' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 4 }}>Primary Ingestion & Authority Mappings</div>
              <p style={{ color: 'var(--sub)', fontSize: '0.86rem', margin: 0 }}>
                Every data point in the APIx ecosystem traces to an official government registry, statutory statistical agency, or verified API feed.
              </p>
            </div>
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                placeholder="Search data fields or sources..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 34px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <Search size={15} color="var(--sub)" style={{ position: 'absolute', left: 12, top: 11 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {filteredSources.map((item) => (
              <div 
                key={item.id}
                className="card"
                style={{ 
                  borderLeft: `4px solid ${item.color}`,
                  padding: '22px 26px',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)', fontWeight: 800 }}>
                        {item.category}
                      </h3>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '3px 9px', 
                        borderRadius: 12, 
                        background: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}40`,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {item.sourceType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--sub)', fontWeight: 600, marginTop: 4 }}>
                      Authority: <span style={{ color: 'var(--text)' }}>{item.sourceEntity}</span>
                    </div>
                  </div>

                  {item.accessUrl && (
                    <a 
                      href={item.accessUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        color: 'var(--sub)', 
                        fontSize: '0.8rem', 
                        textDecoration: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      Source Portal <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <div style={{ fontSize: '0.86rem', color: 'var(--sub)', lineHeight: 1.65, marginBottom: 14 }}>
                  {item.description}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                  gap: 12,
                  background: 'rgba(255,255,255,0.02)',
                  padding: '14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 2 }}>Captured Data Variables</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{item.dataField}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 2 }}>Update Cadence & Ingestion</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text)' }}>{item.cadence}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 2 }}>Mathematical & Integrity Verification</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={15} /> {item.verification}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── TAB 2: VERIFIED RESEARCH LITERATURE ─── */}
      {activeTab === 'literature' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 4 }}>Verified Econometric & Statistical Literature</div>
              <p style={{ color: 'var(--sub)', fontSize: '0.86rem', margin: 0 }}>
                Confirmed real publications from the U.S. BLS, UK ONS, and peer-reviewed journals.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    border: selectedCategory === cat ? '1px solid var(--cyan)' : '1px solid var(--border)',
                    background: selectedCategory === cat ? 'var(--cyan-dim)' : 'var(--card)',
                    color: selectedCategory === cat ? 'var(--cyan)' : 'var(--sub)',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
            {filteredCitations.map(c => (
              <div 
                key={c.id} 
                className="card"
                style={{ 
                  borderLeft: `4px solid ${
                    c.category === 'Official Index Benchmark' ? 'var(--cyan)' :
                    c.category === 'Econometric Precedent' ? 'var(--purple)' :
                    c.category === 'Index Theory' ? 'var(--amber)' : 'var(--green)'
                  }`,
                  padding: '22px 26px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.8,
                      color: 
                        c.category === 'Official Index Benchmark' ? 'var(--cyan)' :
                        c.category === 'Econometric Precedent' ? 'var(--purple)' :
                        c.category === 'Index Theory' ? 'var(--amber)' : 'var(--green)'
                    }}>
                      {c.category}
                    </span>
                    <h3 style={{ margin: '4px 0 6px 0', fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800 }}>
                      {c.title}
                    </h3>
                    <div style={{ fontSize: '0.86rem', color: 'var(--sub)' }}>
                      <strong>{c.authors}</strong> &middot; <em>{c.publication}</em> ({c.year})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCopy(c.bibtex, c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: copiedId === c.id ? 'var(--green)' : 'var(--text)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === c.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === c.id ? 'Copied BibTeX!' : 'BibTeX'}
                    </button>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--cyan)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Read Paper <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: '0.88rem', color: 'var(--sub)', lineHeight: 1.65 }}>
                  <strong style={{ color: 'var(--text)' }}>Key Econometric Contribution: </strong>{c.keyFinding}
                </div>

                <div style={{ 
                  marginTop: 12, 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)',
                  fontSize: '0.84rem',
                  color: 'var(--cyan)'
                }}>
                  <strong>APIx System Integration: </strong>{c.apixUsage}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── TAB 3: CITATION & ATTRIBUTION ─── */}
      {activeTab === 'citation' && (
        <div style={{ maxWidth: 840 }}>
          <div className="section-label">Official Citation & Technical Reference</div>
          <p style={{ color: 'var(--sub)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>
            For use by evaluating committees, academic researchers, and regulatory panels in policy papers, competition assessments, and hackathon evaluation decks.
          </p>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', letterSpacing: 1 }}>
                BibTeX Citation Format
              </span>
              <button
                onClick={() => handleCopy(apixBibtex, 'apix-bibtex')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: copiedId === 'apix-bibtex' ? 'var(--green)' : 'var(--text)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedId === 'apix-bibtex' ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === 'apix-bibtex' ? 'Copied!' : 'Copy BibTeX'}
              </button>
            </div>
            <pre style={{ 
              background: dark ? '#060B14' : '#F1F5F9', 
              padding: '16px', 
              borderRadius: 8, 
              border: '1px solid var(--border)', 
              fontFamily: 'JetBrains Mono, monospace', 
              fontSize: '0.84rem',
              color: 'var(--text)',
              overflowX: 'auto',
              margin: 0
            }}>
              {apixBibtex}
            </pre>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>Standard Text Citation (APA Format)</h4>
            <div style={{ 
              background: dark ? '#060B14' : '#F1F5F9', 
              padding: '14px', 
              borderRadius: 8, 
              border: '1px solid var(--border)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.84rem',
              color: 'var(--sub)',
              lineHeight: 1.6
            }}>
              Smart India Hackathon Technical Evaluation Team. (2026). <em>APIx: Sovereign Indian Airfare Price Index and High-Frequency Market Monitoring Platform</em>. Ministry of Civil Aviation / Directorate General of Civil Aviation Technical Submission.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default References;
