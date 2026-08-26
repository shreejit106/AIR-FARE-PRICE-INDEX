import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header banner (Slides 2 to 6)
        if self._pageNumber > 1:
            self.setFillColor(colors.HexColor("#0284C7"))
            self.drawString(36, 580, "SMART INDIA HACKATHON 2026")
            self.setFillColor(colors.HexColor("#64748B"))
            self.setFont("Helvetica", 8)
            self.drawRightString(756, 580, "APIx — National Airfare Price Index & Regulatory Intelligence")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(36, 574, 756, 574)

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#94A3B8"))
        self.drawString(36, 25, "Ministry of Civil Aviation / DGCA • SIH 2026 Idea Submission")
        page_str = f"Slide {self._pageNumber} of {page_count}"
        self.drawRightString(756, 25, page_str)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(36, 35, 756, 35)
        self.restoreState()

def build_pdf():
    pdf_path = os.path.join(os.getcwd(), "SIH2026_APIx_Idea_Presentation.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter), # 792 x 612 pt
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_main = ParagraphStyle(
        'TitleMain',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0F172A'),
        alignment=1, # Center
    )

    title_sub = ParagraphStyle(
        'TitleSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        textColor=colors.HexColor('#0284C7'),
        alignment=1,
    )

    slide_title = ParagraphStyle(
        'SlideTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=10,
    )

    section_header = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0369A1'),
        spaceBefore=6,
        spaceAfter=3,
    )

    body_text = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
    )

    bullet_text = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1,
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
    )

    story = []

    # ==========================================
    # SLIDE 1: TITLE PAGE
    # ==========================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("SMART INDIA HACKATHON 2026", title_sub))
    story.append(Spacer(1, 8))
    story.append(Paragraph("APIx: National Airfare Price Index &<br/>Regulatory Intelligence Platform", title_main))
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="60%", thickness=2, color=colors.HexColor("#0284C7"), spaceBefore=5, spaceAfter=20))
    
    info_data = [
        [Paragraph("<b>Problem Statement Title:</b>", table_cell_bold), Paragraph("Development of an Airfare Price Index (APIx) for Domestic Scheduled Aviation in India", body_text)],
        [Paragraph("<b>Theme:</b>", table_cell_bold), Paragraph("Smart Automation / Transportation & Logistics / Regulatory Technology", body_text)],
        [Paragraph("<b>Category:</b>", table_cell_bold), Paragraph("Software", body_text)],
        [Paragraph("<b>Target Authority:</b>", table_cell_bold), Paragraph("Ministry of Civil Aviation (MoCA) & Directorate General of Civil Aviation (DGCA)", body_text)],
        [Paragraph("<b>Team ID:</b>", table_cell_bold), Paragraph("[Your Team ID]", body_text)],
        [Paragraph("<b>Team Name:</b>", table_cell_bold), Paragraph("[Your Team Name]", body_text)],
    ]
    
    t_info = Table(info_data, colWidths=[150, 420])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_info)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 2: PROPOSED SOLUTION & INNOVATION
    # ==========================================
    story.append(Paragraph("Slide 2: Proposed Solution & Innovation", slide_title))
    
    # 2-column layout
    col1 = [
        Paragraph("1. Proposed Solution & Working Prototype", section_header),
        Paragraph("• <b>80-Route Sovereign Domestic Basket:</b> Tracks comprehensive fare distributions across 20 metro, secondary, and UDAN airport pairs covering ~92% of scheduled seat capacity.", bullet_text),
        Paragraph("• <b>5 Multi-Lead Horizons:</b> Continuously audits price volatility across T+1 (Emergency/Last-minute), T+7, T+15, T+30, and T+45 booking lead times.", bullet_text),
        Paragraph("• <b>Modified Laspeyres Methodology:</b> Mathematically robust index formula (Base 100.0) weighted by quarterly DGCA Form A/B passenger traffic statistics (w<sub>r</sub>).", bullet_text),
        Paragraph("• <b>Statistical IQR Filtration:</b> Automatic [Q1 - 1.5·IQR, Q3 + 1.5·IQR] bounds trimming predatory gouging spikes & promotional flash fares before computing medians.", bullet_text),
    ]
    
    col2 = [
        Paragraph("2. How it Addresses the Problem & Key Innovations", section_header),
        Paragraph("• <b>Eliminates Regulatory Blindspots:</b> Replaces ad-hoc manual spot-checking with systematic, real-time macro and micro airfare indices.", bullet_text),
        Paragraph("• <b>1-Click DGCA Executive Brief Generator:</b> Auto-compiles live anomaly audits & antitrust matrices into a printable A4 Ministry memo.", bullet_text),
        Paragraph("• <b>Interactive ATF Shock Simulator:</b> Simulates fuel price fluctuations (-20% to +60%) with airline pass-through elasticity to model consumer burden in ₹ Billions.", bullet_text),
        Paragraph("• <b>HHI Antitrust Route Monitor:</b> Computes Herfindahl-Hirschman Index (HHI) for every route to flag monopoly pricing risks (HHI &gt; 2500).", bullet_text),
    ]
    
    t_s2 = Table([[col1, col2]], colWidths=[355, 355])
    t_s2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_s2)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 3: TECHNICAL APPROACH & ARCHITECTURE
    # ==========================================
    story.append(Paragraph("Slide 3: Technical Approach & Architecture", slide_title))
    
    s3_left = [
        Paragraph("1. Technology Stack & Frameworks", section_header),
        Paragraph("• <b>Frontend Client:</b> React 19, TypeScript, Vite, Plotly.js for interactive analytics, Lucide Icons, Modern Vanilla CSS Design System.", bullet_text),
        Paragraph("• <b>Backend API:</b> FastAPI (Python 3.10+), Asynchronous REST microservices, Uvicorn ASGI server with sub-50ms query latency.", bullet_text),
        Paragraph("• <b>Statistical Computing:</b> Python (<code>pandas</code>, <code>numpy</code>, <code>scipy</code>) executing IQR sanitization, median pricing, and Laspeyres index aggregation.", bullet_text),
        Paragraph("• <b>Data Persistence:</b> SQLAlchemy ORM with multi-table relational schema (<code>raw_fares</code>, <code>representative_fares</code>, <code>route_weights</code>, <code>apix_index</code>) — PostgreSQL production-ready (SQLite portable mode).", bullet_text),
        Paragraph("• <b>Orchestration:</b> Apache Airflow DAG architecture for daily scraping, index computation, and quarterly weight rebalancing.", bullet_text),
    ]

    s3_right = [
        Paragraph("2. End-to-End System Pipeline", section_header),
        Paragraph("<b>Step 1: Data Ingestion & Deduplication</b><br/>• Scrapes OTA & airline GDS platforms across 80 routes × 5 horizons.<br/>• Deduplicates fare records based on origin, destination, airline, flight number, and date.", bullet_text),
        Paragraph("<b>Step 2: Statistical IQR Outlier Filtration</b><br/>• Calculates Q1, Q3, and IQR per route/horizon; removes noise & flash anomalies.", bullet_text),
        Paragraph("<b>Step 3: Representative Median Computation</b><br/>• Extracts robust median price P<sub>r,t</sub> across clean flight distributions.", bullet_text),
        Paragraph("<b>Step 4: Modified Laspeyres Aggregation</b><br/>• Applies DGCA passenger weights: <b>APIx<sub>t</sub> = &sum; [ w<sub>r</sub> &times; (P<sub>r,t</sub> / P<sub>r,0</sub>) ] &times; 100</b>", bullet_text),
    ]

    t_s3 = Table([[s3_left, s3_right]], colWidths=[355, 355])
    t_s3.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_s3)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 4: FEASIBILITY & RISK MITIGATION
    # ==========================================
    story.append(Paragraph("Slide 4: Feasibility, Viability & Risk Analysis", slide_title))
    
    story.append(Paragraph("1. Multi-Dimensional Feasibility Analysis", section_header))
    story.append(Paragraph("• <b>Operational Feasibility:</b> Readily combines public DGCA Form A/B city-pair passenger statistics with automated fare ingestion across 20 domestic hubs.<br/>• <b>Technical Feasibility:</b> Stateless, lightweight architecture running in real-time with responsive UI and sub-50ms API response latency.<br/>• <b>Economic Viability:</b> Zero expensive commercial API dependencies; built 100% on open-source, sovereign, and scalable technology.", bullet_text))
    story.append(Spacer(1, 4))
    
    story.append(Paragraph("2. Potential Challenges & Implemented Mitigation Strategies", section_header))
    
    risk_table_data = [
        [Paragraph("<b>Potential Challenge</b>", table_header), Paragraph("<b>Operational Impact</b>", table_header), Paragraph("<b>Mitigation Strategy Implemented</b>", table_header)],
        [
            Paragraph("<b>Extreme Fare Volatility & Flash Sales</b>", table_cell_bold),
            Paragraph("Distorts median index with temporary promotional or predatory spikes.", table_cell),
            Paragraph("<b>IQR Outlier Trimming:</b> Automatically bounds fares between [Q1 - 1.5·IQR, Q3 + 1.5·IQR] before index calculation.", table_cell)
        ],
        [
            Paragraph("<b>Seasonal Traffic Pattern Shifts</b>", table_cell_bold),
            Paragraph("Fixed route weights become obsolete over time (e.g. holiday routes).", table_cell),
            Paragraph("<b>Quarterly Weight Rebalancing:</b> Dynamic update engine recalculates route weights (w<sub>r</sub>) each quarter via DGCA Form A/B data.", table_cell)
        ],
        [
            Paragraph("<b>Anti-Scraping / Portal Rate Limits</b>", table_cell_bold),
            Paragraph("Scraping disruptions leading to incomplete daily fare baskets.", table_cell),
            Paragraph("<b>Distributed Fetching & Robust Fallbacks:</b> Staggered asynchronous requests and persistent SQLite/PostgreSQL caching.", table_cell)
        ],
        [
            Paragraph("<b>Sovereignty & Territorial Accuracy</b>", table_cell_bold),
            Paragraph("Map rendering errors violating national cartographic guidelines.", table_cell),
            Paragraph("<b>Strict SoI Compliance:</b> Map views rigorously follow Survey of India guidelines (100% integral Indian territory).", table_cell)
        ]
    ]

    t_risk = Table(risk_table_data, colWidths=[180, 180, 350])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_risk)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 5: IMPACT AND BENEFITS
    # ==========================================
    story.append(Paragraph("Slide 5: Impact and Socio-Economic Benefits", slide_title))
    
    s5_col1 = [
        Paragraph("1. Direct Stakeholder Impact", section_header),
        Paragraph("• <b>Ministry of Civil Aviation & DGCA:</b> Provides an objective, reproducible metric to establish empirical surge thresholds, evaluate fare caps (CAP 3.4), and formulate aviation policies.", bullet_text),
        Paragraph("• <b>Competition Commission of India (CCI):</b> Route-level HHI visibility enables proactive monitoring of airline cartelization and monopoly exploitation on high-density routes.", bullet_text),
        Paragraph("• <b>Indian Consumers (Air Travelers):</b> Complete transparency on fair baseline market fares, surge patterns across lead times, and data-backed optimal booking windows.", bullet_text),
        Paragraph("• <b>Airlines & Industry Operators:</b> Transparent competitive benchmarks without distorting market-driven revenue management.", bullet_text),
    ]

    s5_col2 = [
        Paragraph("2. Broad Socio-Economic Benefits", section_header),
        Paragraph("• <b>Macroeconomic Inflation Tracking:</b> Integrates seamlessly with MOSPI CPI transport sub-indices for inflation forecasting.", bullet_text),
        Paragraph("• <b>Regional Connectivity (UDAN Support):</b> Uncovers price disparities between Tier-1 metro trunk routes and Tier-2/3 regional routes, supporting equitable air connectivity.", bullet_text),
        Paragraph("• <b>Consumer Welfare Protection:</b> Quantifies total national consumer financial impact under fuel shocks or peak festival demand.", bullet_text),
        Paragraph("• <b>Sovereign Data Asset:</b> Establishes India's first standardized, independent air transport price tracking infrastructure.", bullet_text),
    ]

    t_s5 = Table([[s5_col1, s5_col2]], colWidths=[355, 355])
    t_s5.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_s5)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 6: RESEARCH & REFERENCES
    # ==========================================
    story.append(Paragraph("Slide 6: Research, Citations & Standards", slide_title))
    
    refs_data = [
        Paragraph("1. Regulatory Data Sources & Methodological Standards", section_header),
        Paragraph("• <b>Directorate General of Civil Aviation (DGCA), Govt of India:</b> Monthly Domestic Air Traffic Statistics, City-Pair Passenger Volume Reports (Form A & B) & On-Time Performance Reports (OTP) — <i>dgca.gov.in</i>", bullet_text),
        Paragraph("• <b>Ministry of Statistics & Programme Implementation (MOSPI):</b> Consumer Price Index (CPI) Manual, Laspeyres Index Weighting Principles & Methodological Guidelines — <i>mospi.gov.in</i>", bullet_text),
        Paragraph("• <b>Competition Commission of India (CCI):</b> Market Concentration Assessment Standards & Herfindahl-Hirschman Index (HHI) Regulatory Frameworks.", bullet_text),
        Paragraph("• <b>Ministry of Petroleum & Natural Gas (MoPNG):</b> Aviation Turbine Fuel (ATF) Pricing Trends, Tax Structures & Airline Operating Cost Breakdowns (~35-40% fuel cost share).", bullet_text),
        Paragraph("• <b>International Civil Aviation Organization (ICAO):</b> Doc 9626 — Manual on the Regulation of International Air Transport: Tariff Monitoring Guidelines & Airfare Indices.", bullet_text),
        Spacer(1, 6),
        Paragraph("2. Project Repository & Verification", section_header),
        Paragraph("• <b>Live Evaluation URL:</b> <code>http://localhost:5173</code> (React Frontend) | <code>http://localhost:8000/docs</code> (FastAPI Engine)", bullet_text),
        Paragraph("• <b>GitHub Repository:</b> <i>shreejit106/AIR-FARE-PRICE-INDEX</i>", bullet_text),
    ]
    
    story.extend(refs_data)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {pdf_path}")

if __name__ == '__main__':
    build_pdf()
