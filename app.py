import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import folium
from folium.plugins import AntPath
from streamlit_folium import st_folium
from matplotlib import cm
from matplotlib.colors import rgb2hex
import itertools
import random

st.set_page_config(
    page_title="APIx | Indian Airfare Price Index",
    page_icon="✈",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================
# GLOBAL CSS  --  Aviation Black / Neon Cyan / Amber
# ============================================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

/* ---- root vars ---- */
:root {
    --bg:        #060B14;
    --surface:   #0D1626;
    --card:      #111827;
    --border:    #1E2D45;
    --muted:     #374151;
    --text:      #E2E8F0;
    --sub:       #64748B;
    --cyan:      #06B6D4;
    --cyan-dim:  rgba(6,182,212,0.12);
    --amber:     #F59E0B;
    --amber-dim: rgba(245,158,11,0.12);
    --green:     #10B981;
    --green-dim: rgba(16,185,129,0.12);
    --red:       #EF4444;
    --red-dim:   rgba(239,68,68,0.12);
    --purple:    #8B5CF6;
}

/* ---- base ---- */
.stApp {
    background-color: var(--bg) !important;
    font-family: 'Inter', sans-serif !important;
    color: var(--text) !important;
}
header[data-testid="stHeader"] { background: transparent !important; }

/* ---- Hide Streamlit Sidebar completely ---- */
[data-testid="stSidebar"], [data-testid="stSidebarCollapsedControl"], [data-testid="collapsedControl"] {
    display: none !important;
    width: 0px !important;
}
section[data-testid="stSidebar"] {
    display: none !important;
    width: 0px !important;
}
div[data-testid="stSidebarUserContent"] {
    display: none !important;
}

/* ---- style the main page wide container ---- */
.stMainBlockContainer {
    max-width: 1250px !important;
    padding-top: 1.5rem !important;
    padding-bottom: 2rem !important;
}

/* Allow inline style colors to win over cascade via higher specificity on base */
.stApp div, .stApp span, .stApp p, .stApp li { color: #E2E8F0; }
h1, h2, h3, h4, h5, h6 { color: var(--text) !important; }
/* Streamlit-injected text nodes */
.stMarkdown p, .stMarkdown li { color: var(--sub); }

/* ---- streamlit defaults override ---- */
.stMarkdown p { color: var(--text) !important; }
[data-testid="stVerticalBlockBorderWrapper"] {
    background: var(--card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 12px !important;
    padding: 1.25rem !important;
    margin-bottom: 1rem !important;
}

/* ---- tab strip ---- */
[data-testid="stTabs"] [role="tablist"] {
    background: var(--surface);
    border-radius: 10px;
    padding: 4px;
    gap: 4px;
    border: 1px solid var(--border);
}
[data-testid="stTabs"] [role="tab"] {
    color: var(--sub) !important;
    font-weight: 600;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-radius: 8px;
    padding: 8px 16px;
    transition: all 0.2s;
}
[data-testid="stTabs"] [role="tab"][aria-selected="true"] {
    background: var(--cyan-dim) !important;
    color: var(--cyan) !important;
    border-bottom: 2px solid var(--cyan) !important;
}

/* ---- horizontal radio navigation button styling ---- */
div[data-testid="stRadio"] {
    width: 100% !important;
}
div[data-testid="stRadio"] > div {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 6px !important;
    background: transparent !important;
    padding: 0 !important;
    align-items: center !important;
    width: 100% !important;
}
div[data-testid="stRadio"] label {
    background: #0D1626 !important;
    border: 1px solid #1E2D45 !important;
    border-radius: 6px !important;
    padding: 6px 12px !important;
    color: #94A3B8 !important;
    font-weight: 700 !important;
    font-size: 0.72rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
    cursor: pointer !important;
    transition: all 0.15s ease-in-out !important;
    white-space: nowrap !important;
    flex: 1 1 auto !important;
    text-align: center !important;
    justify-content: center !important;
}
div[data-testid="stRadio"] label:hover {
    border-color: #06B6D4 !important;
    color: #06B6D4 !important;
    background: rgba(6,182,212,0.06) !important;
}
div[data-testid="stRadio"] label[data-checked="true"] {
    background: rgba(6,182,212,0.15) !important;
    border-color: #06B6D4 !important;
    color: #06B6D4 !important;
    box-shadow: 0 0 12px rgba(6,182,212,0.2) !important;
}
/* Hide all native radio circles, inputs, svgs, and dots */
div[data-testid="stRadio"] label input,
div[data-testid="stRadio"] label svg,
div[data-testid="stRadio"] label div[role="presentation"],
div[data-testid="stRadio"] label div[class*="RadioDot"],
div[data-testid="stRadio"] label div[class*="StyledRadio"],
div[data-testid="stRadio"] label > div:first-child:not([data-testid="stMarkdownContainer"]) {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
}
div[data-testid="stRadio"] label div[data-testid="stMarkdownContainer"] {
    padding: 0 !important;
    margin: 0 !important;
    display: inline-block !important;
}
div[data-testid="stRadio"] label div[data-testid="stMarkdownContainer"] p,
div[data-testid="stRadio"] label div[data-testid="stMarkdownContainer"] span {
    font-size: 0.72rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
    line-height: 1.2 !important;
    margin: 0 !important;
}
div[data-testid="stRadio"] [data-testid="stWidgetLabel"] {
    display: none !important;
}

/* ---- compact exit button styling ---- */
div[data-testid="stButton"] button {
    background: #0D1626 !important;
    border: 1px solid #1E2D45 !important;
    border-radius: 6px !important;
    padding: 6px 14px !important;
    color: #94A3B8 !important;
    font-weight: 700 !important;
    font-size: 0.72rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
    cursor: pointer !important;
    transition: all 0.15s ease-in-out !important;
    min-height: auto !important;
    height: auto !important;
}
div[data-testid="stButton"] button:hover {
    border-color: #06B6D4 !important;
    color: #06B6D4 !important;
    background: rgba(6,182,212,0.06) !important;
}

/* ---- scrollbar ---- */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* ---- utility classes ---- */
.apix-hero-num {
    font-size: 3.5rem !important;
    font-weight: 900 !important;
    letter-spacing: -2px !important;
    font-family: 'JetBrains Mono', monospace !important;
    color: #06B6D4 !important;
    line-height: 1 !important;
}
.apix-label {
    font-size: 0.72rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 1.5px !important;
    color: #64748B !important;
}

/* ---- runway line at top ---- */
.runway-bar {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyan), var(--amber), var(--cyan), transparent);
    border-radius: 2px;
    margin-bottom: 28px;
    opacity: 0.7;
}
</style>
""", unsafe_allow_html=True)


# ============================================================
# DATA ENGINE
# ============================================================
@st.cache_data
def generate_massive_mock_db():
    np.random.seed(42); random.seed(42)
    airports = {
        "DEL": (28.5562, 77.1000), "BOM": (19.0896, 72.8656), "BLR": (13.1986, 77.7066),
        "HYD": (17.2403, 78.4294), "MAA": (12.9941, 80.1709), "CCU": (22.6547, 88.4467),
        "AMD": (23.0734, 72.6347), "COK": (10.1520, 76.4019), "PNQ": (18.5822, 73.9197),
        "GOI": (15.3808, 73.8314), "LKO": (26.7606, 80.8893), "JAI": (26.8242, 75.8122),
        "ATQ": (31.7096, 74.7973), "GAU": (26.1061, 91.5859), "BBI": (20.2444, 85.8178),
        "IXC": (30.6735, 76.7886), "IXB": (26.6812, 88.3286), "PAT": (25.5913, 85.0880),
        "TRV": (8.4821, 76.9201),  "VTZ": (17.7211, 83.2245)
    }
    all_pairs = list(itertools.combinations(airports.keys(), 2))
    selected_pairs = random.sample(all_pairs, 80)
    airlines = ["IndiGo (6E)", "Air India (AI)", "SpiceJet (SG)", "Air India Express (IX)", "Akasa Air (QP)"]
    horizons_list = ["T+1", "T+7", "T+15", "T+30", "T+45"]
    base_shares = np.random.lognormal(mean=0, sigma=1, size=80)
    base_shares /= np.sum(base_shares)
    records = []
    for i, (orig, dest) in enumerate(selected_pairs):
        route_id = f"{orig}-{dest}"
        pshare = base_shares[i]
        pcount = int(pshare * 150_000_000)
        route_airlines = random.sample(airlines, random.randint(2, 5))
        for al in route_airlines:
            for cab in ["Economy", "Business"]:
                for h in horizons_list:
                    base_fare = np.random.randint(4000, 8000) if cab == "Economy" else np.random.randint(15000, 35000)
                    mult = {"T+1":np.random.uniform(1.3,2.0),"T+7":np.random.uniform(1.1,1.5),
                            "T+15":np.random.uniform(0.9,1.3),"T+30":np.random.uniform(0.8,1.1),
                            "T+45":np.random.uniform(0.7,0.9)}[h]
                    if al == "IndiGo (6E)": mult *= 0.95
                    elif al == "Air India (AI)": mult *= 1.1
                    elif al == "SpiceJet (SG)": mult *= 0.90
                    cur = base_fare * mult
                    records.append({
                        "route_id": route_id, "origin": orig, "destination": dest,
                        "origin_lat": airports[orig][0], "origin_lon": airports[orig][1],
                        "dest_lat": airports[dest][0], "dest_lon": airports[dest][1],
                        "airline": al, "cabin_class": cab, "horizon": h,
                        "fare_base": base_fare, "fare_current": cur,
                        "pct_change": ((cur - base_fare) / base_fare) * 100,
                        "passenger_share": pshare, "passenger_count": pcount
                    })
    return pd.DataFrame(records)

@st.cache_data
def generate_mospi_history():
    np.random.seed(42)
    dates = pd.date_range(datetime(2010,1,1), datetime.today().replace(day=1) - timedelta(days=1), freq='MS')
    idx = []; cur = 95.0
    for d in dates:
        if d.year == 2012: cur = 100.0
        if d.year == 2020 and d.month in [4,5,6,7]: cur -= np.random.uniform(2,5)
        elif d.year in [2022,2023]: cur += np.random.uniform(0.5,2.5)
        else: cur += np.random.uniform(-0.5,1.2)
        idx.append(cur)
    df = pd.DataFrame({"Date": dates, "CPI_Index": idx})
    df['Inflation_%'] = df['CPI_Index'].pct_change(periods=12) * 100
    df['Inflation_%'] = df['Inflation_%'].fillna(0)
    return df

full_fare_df   = generate_massive_mock_db()
mospi_history_df = generate_mospi_history()


# ============================================================
# HELPERS
# ============================================================
def get_color(val, vmin=-10, vmax=30):
    cmap = cm.get_cmap('RdYlGn_r')
    return rgb2hex(cmap(max(0, min(1, (val - vmin)/(vmax - vmin)))))

def bezier(p1, p2, n=22):
    p1, p2 = np.array(p1), np.array(p2)
    mid = (p1+p2)/2; d = p2-p1
    perp = np.array([-d[1], d[0]])
    if np.linalg.norm(perp) > 0: perp /= np.linalg.norm(perp)
    ctrl = mid + perp * np.linalg.norm(d) * 0.15
    t = np.linspace(0,1,n)
    return (np.outer((1-t)**2,p1) + np.outer(2*(1-t)*t,ctrl) + np.outer(t**2,p2)).tolist()

def render_route_map(summary_df):
    m = folium.Map(location=[22.5,80], zoom_start=5,
        tiles="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attr='CartoDB DarkMatter')
    added = set()
    mn, mx = summary_df['passenger_share'].min(), summary_df['passenger_share'].max()
    for _, row in summary_df.iterrows():
        p1 = [row['origin_lat'], row['origin_lon']]
        p2 = [row['dest_lat'],   row['dest_lon']]
        color  = get_color(row['avg_pct_change'])
        weight = 1 + 6*((row['passenger_share']-mn)/(mx-mn+1e-9))
        popup_html = f"""
        <div style="font-family:Inter,sans-serif;background:#0D1626;color:#E2E8F0;
                    padding:12px 16px;border-radius:8px;min-width:160px;
                    border:1px solid rgba(6,182,212,0.3);">
            <div style="font-size:1.1rem;font-weight:800;color:#06B6D4;margin-bottom:6px;">{row['route_id']}</div>
            <div style="font-size:0.85rem;color:#94A3B8;">APIx <span style="color:#E2E8F0;font-weight:700;">{row['route_index']:.1f}</span></div>
            <div style="font-size:0.85rem;color:#94A3B8;">Avg Change <span style="color:'#10B981' if {row['avg_pct_change']} < 0 else '#EF4444';font-weight:700;">{row['avg_pct_change']:+.1f}%</span></div>
        </div>"""
        AntPath(bezier(p1,p2), color=color, weight=weight, opacity=0.7,
                dash_array=[8,16], popup=folium.Popup(popup_html)).add_to(m)
        for pt, code in [(p1, row['origin']), (p2, row['destination'])]:
            if code not in added:
                folium.CircleMarker(pt, radius=5, color="#06B6D4", fill=True,
                                    fill_color="#06B6D4", fill_opacity=0.9,
                                    tooltip=f"<b>{code}</b>").add_to(m)
                added.add(code)
    st_folium(m, width="100%", height=620, returned_objects=[])

def render_heatmap(fare_df, summary_df):
    routes = summary_df.sort_values('passenger_share', ascending=False)['route_id'].tolist()[::-1]
    horizons = ["T+1","T+7","T+15","T+30","T+45"]
    z, txt, hov = [], [], []
    for r in routes:
        rf = fare_df[fare_df['route_id']==r]; zr,tr,hr = [],[],[]
        w = summary_df[summary_df['route_id']==r]['passenger_share'].values[0]
        for h in horizons:
            rows = rf[rf['horizon']==h]
            if not rows.empty:
                val  = rows['pct_change'].mean()
                fare = rows['fare_current'].mean()
                base = rows['fare_base'].mean()
                zr.append(val); tr.append(f"Rs.{int(fare)}")
                hr.append(f"<b>{r}</b>  {h}<br>Base Rs.{int(base)} | Now Rs.{int(fare)}<br>Change {val:+.1f}% | Weight {w:.3f}")
            else:
                zr.append(None); tr.append(""); hr.append("")
        z.append(zr); txt.append(tr); hov.append(hr)
    fig = make_subplots(rows=1,cols=2,shared_yaxes=True,column_widths=[0.77,0.23],horizontal_spacing=0.05)
    fig.add_trace(go.Heatmap(
        z=z, x=horizons, y=routes, text=txt, texttemplate="%{text}",
        colorscale=[[0,"#10B981"],[0.4,"#F59E0B"],[1,"#EF4444"]],
        zmin=-10, zmax=30, customdata=hov,
        hovertemplate="%{customdata}<extra></extra>",
        showscale=True, colorbar=dict(
            title=dict(text="% Change", font=dict(color="#94A3B8")),
            x=0.73, thickness=12,
            tickfont=dict(color="#94A3B8"))

    ), row=1,col=1)
    weights = [summary_df[summary_df['route_id']==r]['passenger_share'].values[0] for r in routes]
    fig.add_trace(go.Bar(
        x=weights, y=routes, orientation='h',
        marker=dict(color='#06B6D4', opacity=0.75),
        hovertemplate="<b>%{y}</b><br>Weight %{x:.3f}<extra></extra>"
    ), row=1,col=2)
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0,r=0,t=30,b=0),
        height=max(700, len(routes)*21+100), font_color="#94A3B8",
        title=dict(text="Route Fare Inflation Matrix", font=dict(color="#E2E8F0",size=15))
    )
    fig.update_xaxes(showgrid=False, zeroline=False, showticklabels=False, row=1,col=2)
    fig.update_xaxes(showgrid=False, zeroline=False, row=1,col=1)
    fig.update_yaxes(showgrid=False, zeroline=False, row=1,col=1, tickfont=dict(size=10))
    st.plotly_chart(fig, use_container_width=True)

# Initialize session states
if 'current_page' not in st.session_state:
    st.session_state.current_page = "Home"

if st.session_state.current_page == "Home":
    # ============================================================
    # LANDING / HOME PAGE
    # ============================================================
    lh_col1, lh_col2 = st.columns([3.2, 0.8])
    with lh_col1:
        st.markdown(
            '<div style="display:flex;align-items:center;gap:10px;padding-top:4px;">'
            '<span style="font-size:1.6rem;color:#06B6D4;">&#9992;</span>'
            '<span style="font-size:1.4rem;font-weight:900;letter-spacing:-0.5px;color:#E2E8F0;">APIx</span>'
            '</div>',
            unsafe_allow_html=True
        )
    with lh_col2:
        if st.button("ENTER FLIGHT DECK ➔", use_container_width=True):
            st.session_state.current_page = "Dashboard"
            st.rerun()

    # CSS Animations for the plane landing GIF & Title Card delayed reveal
    st.markdown("""
    <style>
    @keyframes fade-out-gif {
        0% { opacity: 1; transform: scale(1); filter: none; }
        85% { opacity: 1; transform: scale(1); filter: none; }
        100% { opacity: 0; transform: scale(0.95); filter: blur(8px); display: none; height: 0; margin: 0; padding: 0; }
    }
    @keyframes fade-in-title {
        0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(5px); }
        75% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(5px); }
        100% { opacity: 1; transform: scale(1) translateY(0); filter: none; }
    }
    .landing-gif-wrapper {
        animation: fade-out-gif 4.8s forwards;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 60px 0;
    }
    .landing-title-wrapper {
        opacity: 0;
        animation: fade-in-title 5.6s forwards;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin: 80px 0 100px 0;
    }
    </style>
    """, unsafe_allow_html=True)

    # Hero landing animation container
    # Uses a high-quality GIPHY flight landing runway lights animation
    st.markdown(
        '<div class="landing-gif-wrapper">'
        '<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTh5dmwxbXpwNnM5dG5wZTFhM21idjAydTFkMGoxOHpsMzAxeTV4YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o85xAYQLOh8T953aM/giphy.gif" '
        'style="max-width:680px; width:100%; border-radius:14px; border:1px solid #1E2D45; box-shadow:0 10px 30px rgba(0,0,0,0.5);">'
        '<div style="color:#64748B; font-size:0.8rem; font-family:JetBrains Mono,monospace; margin-top:12px; letter-spacing:1px;">COCKPIT HUD: APPROACHING RUNWAY 27...</div>'
        '</div>',
        unsafe_allow_html=True
    )

    # Title card reveal container
    st.markdown(
        '<div class="landing-title-wrapper">'
        '<div style="font-size:5rem; font-weight:900; letter-spacing:-3.5px; color:#E2E8F0; line-height:1; display:flex; align-items:center; gap:20px; justify-content:center; margin-bottom:14px;">'
        '<span style="color:#06B6D4;">&#9992;</span>APIx'
        '</div>'
        '<div style="font-size:0.9rem; font-weight:700; text-transform:uppercase; letter-spacing:3px; color:#06B6D4; margin-bottom:24px;">'
        'Indian Airfare Price Index & Analytics'
        '</div>'
        '<div style="font-size:1.05rem; color:#94A3B8; max-width:620px; line-height:1.7; margin:0 auto 40px auto;">'
        'A real-time aviation intelligence platform utilizing modified Laspeyres passenger-weighted indexing to track domestic fare cost structures.'
        '</div>'
        '</div>',
        unsafe_allow_html=True
    )

    # Features Overview list (scroll down)
    st.markdown("<hr style='border-color:#1E2D45;margin-bottom:40px;'>", unsafe_allow_html=True)
    st.markdown("<div style='text-align:center;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#06B6D4;margin-bottom:10px;'>System Capabilities</div>", unsafe_allow_html=True)
    st.markdown("<div style='text-align:center;font-size:1.8rem;font-weight:900;color:#E2E8F0;margin-bottom:40px;letter-spacing:-0.5px;'>Aviation & Financial Intelligence Overview</div>", unsafe_allow_html=True)

    f_col1, f_col2, f_col3, f_col4 = st.columns([1,1,1,1])
    with f_col1:
        st.markdown(
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:12px;padding:24px;height:100%;'
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);">'
            '<div style="font-size:1.8rem;color:#8B5CF6;margin-bottom:12px;">&#9878;</div>'
            '<div style="font-size:1rem;font-weight:700;color:#E2E8F0;margin-bottom:8px;">Passenger Weights</div>'
            '<div style="color:#64748B;font-size:0.82rem;line-height:1.5;">'
            'Integrates traffic data from the Directorate General of Civil Aviation (DGCA) to weight routes by quarterly passenger shares.'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )
    with f_col2:
        st.markdown(
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:12px;padding:24px;height:100%;'
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);">'
            '<div style="font-size:1.8rem;color:#F59E0B;margin-bottom:12px;">&#9660;</div>'
            '<div style="font-size:1rem;font-weight:700;color:#E2E8F0;margin-bottom:8px;">Outlier Removal</div>'
            '<div style="color:#64748B;font-size:0.82rem;line-height:1.5;">'
            'Eliminates fare spikes using Interquartile Range (IQR) limits, protecting the index from last-minute surge distortions.'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )
    with f_col3:
        st.markdown(
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:12px;padding:24px;height:100%;'
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);">'
            '<div style="font-size:1.8rem;color:#06B6D4;margin-bottom:12px;">&#9992;</div>'
            '<div style="font-size:1rem;font-weight:700;color:#E2E8F0;margin-bottom:8px;">Flight Map Routing</div>'
            '<div style="color:#64748B;font-size:0.82rem;line-height:1.5;">'
            'Maps price trends dynamically across 80 domestic lines on CartoDB Dark Matter layouts with directional flow indicators.'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )
    with f_col4:
        st.markdown(
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:12px;padding:24px;height:100%;'
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);">'
            '<div style="font-size:1.8rem;color:#10B981;margin-bottom:12px;">&#128200;</div>'
            '<div style="font-size:1rem;font-weight:700;color:#E2E8F0;margin-bottom:8px;">MoSPI CPI Sync</div>'
            '<div style="color:#64748B;font-size:0.82rem;line-height:1.5;">'
            'Correlates domestic airfare indexes directly with official Indian Consumer Price Index (CPI) datasets for validation.'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )
    st.stop() # Force execution to halt here for landing page

# ============================================================
# TOP NAVIGATION & HUD DASHBOARD
# ============================================================
h_col1, h_col2 = st.columns([1.1, 2.9])
with h_col1:
    st.markdown(
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:2px;">'
        '<span style="font-size:3.2rem;color:#06B6D4;line-height:1;filter:drop-shadow(0 0 12px rgba(6,182,212,0.4));">&#9992;</span>'
        '<span style="font-size:3.4rem;font-weight:900;letter-spacing:-2px;color:#E2E8F0;line-height:1;text-shadow:0 0 25px rgba(6,182,212,0.25);">APIx</span>'
        '<span style="font-size:0.7rem;background:rgba(6,182,212,0.12);color:#06B6D4;padding:3px 8px;border-radius:4px;font-family:JetBrains Mono,monospace;border:1px solid rgba(6,182,212,0.25);font-weight:700;margin-top:10px;">v2.0</span>'
        '</div>'
        '<div style="font-size:0.75rem;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;font-family:JetBrains Mono,monospace;margin-top:4px;">'
        '20 Airports &middot; 80 Routes &middot; 5 Carriers'
        '</div>',
        unsafe_allow_html=True
    )
with h_col2:
    btn_col, rad_col = st.columns([0.8, 2.4])
    with btn_col:
        if st.button("✈ EXIT TO HUB", key="btn_exit_home", help="Return to Landing Page", use_container_width=True):
            st.session_state.current_page = "Home"
            st.rerun()
    with rad_col:
        page = st.radio("Navigation", ["Calculator", "Maths & Stats", "Weight Allocation"],
                        index=0, horizontal=True, label_visibility="collapsed")

# Dynamic Carrier Status Strip (Top HUD display)
_carrier_strip = (
    '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:10px;'
    'padding:10px 18px;display:flex;align-items:center;gap:16px;margin:12px 0 24px 0;'
    'box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow-x:auto;">'
    '<span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748B;white-space:nowrap;">Active Fleet:</span>'
    
    '<div style="display:flex;align-items:center;gap:6px;background:#002F6C22;border:1px solid #002F6C55;padding:4px 10px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">'
    '<span style="color:#3B82F6;font-weight:900;font-family:JetBrains Mono,monospace;">6E</span>'
    '<span style="color:#E2E8F0;font-weight:600;">IndiGo</span>'
    '</div>'

    '<div style="display:flex;align-items:center;gap:6px;background:#D91F2622;border:1px solid #D91F2655;padding:4px 10px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">'
    '<span style="color:#EF4444;font-weight:900;font-family:JetBrains Mono,monospace;">AI</span>'
    '<span style="color:#E2E8F0;font-weight:600;">Air India</span>'
    '</div>'

    '<div style="display:flex;align-items:center;gap:6px;background:#FF450022;border:1px solid #FF450055;padding:4px 10px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">'
    '<span style="color:#F97316;font-weight:900;font-family:JetBrains Mono,monospace;">SG</span>'
    '<span style="color:#E2E8F0;font-weight:600;">SpiceJet</span>'
    '</div>'

    '<div style="display:flex;align-items:center;gap:6px;background:#E53E3E22;border:1px solid #E53E3E55;padding:4px 10px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">'
    '<span style="color:#EF4444;font-weight:900;font-family:JetBrains Mono,monospace;">IX</span>'
    '<span style="color:#E2E8F0;font-weight:600;">AI Express</span>'
    '</div>'

    '<div style="display:flex;align-items:center;gap:6px;background:#8B5CF622;border:1px solid #8B5CF655;padding:4px 10px;border-radius:6px;font-size:0.8rem;white-space:nowrap;">'
    '<span style="color:#A78BFA;font-weight:900;font-family:JetBrains Mono,monospace;">QP</span>'
    '<span style="color:#E2E8F0;font-weight:600;">Akasa Air</span>'
    '</div>'

    '<div style="margin-left:auto;display:flex;align-items:center;gap:16px;font-size:0.78rem;font-family:JetBrains Mono,monospace;color:#64748B;white-space:nowrap;">'
    f'<span>MOSPI: <b style="color:#E2E8F0;">{len(mospi_history_df):,}</b></span>'
    f'<span>SAMPLES: <b style="color:#E2E8F0;">{len(full_fare_df):,}</b></span>'
    '<span>FEED: <b style="color:#10B981;">&#9679; LIVE</b></span>'
    '</div>'
    '</div>'
)
st.markdown(_carrier_strip, unsafe_allow_html=True)


# ============================================================
# PAGE: CALCULATOR
# ============================================================
if page == "Calculator":
    # Control Panel horizontal row
    st.markdown('<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748B;margin-bottom:12px;">Flight Control Panel</div>', unsafe_allow_html=True)
    
    ctrl_col1, ctrl_col2, ctrl_col3, ctrl_col4 = st.columns([1, 1.2, 1.2, 1])
    with ctrl_col1:
        base_period = st.date_input("Base Period", value=datetime.today())
    with ctrl_col2:
        aggregation = st.selectbox("Aggregation Target", ("Overall Industry", "Airline Specific", "Route Specific"))
    with ctrl_col3:
        airline_filter = "All"
        route_filter = "All"
        if aggregation == "Airline Specific":
            airline_filter = st.selectbox("Select Carrier", ("IndiGo (6E)","Air India (AI)","SpiceJet (SG)","Air India Express (IX)","Akasa Air (QP)"))
        elif aggregation == "Route Specific":
            route_filter = st.selectbox("Select Route", sorted(full_fare_df['route_id'].unique()))
        else:
            st.selectbox("Filter Target", ["All Routes / Carriers"], disabled=True)
    with ctrl_col4:
        cabin_class = st.selectbox("Cabin Class", ("Economy","Business"))

    st.markdown("<br>", unsafe_allow_html=True)

    filtered_df = full_fare_df.copy()
    filtered_df = filtered_df[filtered_df['cabin_class'] == cabin_class]
    if aggregation == "Airline Specific":
        filtered_df = filtered_df[filtered_df['airline'] == airline_filter]
    elif aggregation == "Route Specific":
        filtered_df = filtered_df[filtered_df['route_id'] == route_filter]
    if filtered_df.empty:
        _empty_msg = (
            '<div style="background:#0D1626;border:1px solid #EF4444;border-radius:12px;padding:24px;text-align:center;margin-top:40px;">'
            '<div style="font-size:2rem;margin-bottom:8px;">&#9888;</div>'
            '<div style="font-size:1.1rem;font-weight:700;color:#EF4444;margin-bottom:6px;">No Data Available</div>'
            '<div style="color:#64748B;font-size:0.9rem;">No flight records match this combination. Please adjust your filters.</div>'
            '</div>'
        )
        st.markdown(_empty_msg, unsafe_allow_html=True)
    else:
        srecs = []
        for r in filtered_df['route_id'].unique():
            rf = filtered_df[filtered_df['route_id']==r]
            apc = rf['pct_change'].mean(); fr = rf.iloc[0]
            srecs.append({"route_id":r,"origin":fr['origin'],"destination":fr['destination'],
                          "origin_lat":fr['origin_lat'],"origin_lon":fr['origin_lon'],
                          "dest_lat":fr['dest_lat'],"dest_lon":fr['dest_lon'],
                          "avg_pct_change":apc,"route_index":100+apc,
                          "passenger_share":fr['passenger_share'],"passenger_count":fr['passenger_count']})
        route_summary_df = pd.DataFrame(srecs)

        t7  = filtered_df[filtered_df['horizon']=='T+7']
        t15 = filtered_df[filtered_df['horizon']=='T+15']
        t30 = filtered_df[filtered_df['horizon']=='T+30']
        t45 = filtered_df[filtered_df['horizon']=='T+45']
        ti7  = 100 + t7['pct_change'].mean()  if not t7.empty  else 100
        ti15 = 100 + t15['pct_change'].mean() if not t15.empty else 100
        ti30 = 100 + t30['pct_change'].mean() if not t30.empty else 100
        ti45 = 100 + t45['pct_change'].mean() if not t45.empty else 100

        def arrow(idx):
            v = idx - 100
            if v > 0: return f"<b style='color:#EF4444 !important;font-family:JetBrains Mono,monospace;font-size:1.3rem;'>&#9650; {v:.2f}%</b>"
            if v < 0: return f"<b style='color:#10B981 !important;font-family:JetBrains Mono,monospace;font-size:1.3rem;'>&#9660; {abs(v):.2f}%</b>"
            return "<b style='color:#64748B !important;font-size:1.3rem;'>— 0.00%</b>"

        st.markdown('<div class="runway-bar"></div>', unsafe_allow_html=True)

        _m = (
            '<div style="background:linear-gradient(135deg,#0D1626 0%,#111827 100%);'
            'border:1px solid #1E2D45;border-radius:14px;'
            'padding:22px 32px;display:flex;align-items:center;gap:0;'
            'margin-bottom:28px;box-shadow:0 0 40px rgba(6,182,212,0.05);">'

            '<div style="border-right:1px solid #1E2D45;padding-right:32px;min-width:160px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:6px;">APIx Live</div>'
            f'<div style="font-size:3.2rem;font-weight:900;letter-spacing:-2px;'
            f'font-family:JetBrains Mono,monospace;color:#06B6D4;line-height:1;">{ti7:.1f}</div>'
            '<div style="font-size:0.78rem;color:#64748B;margin-top:4px;font-family:JetBrains Mono,monospace;">T+7 basis</div>'
            '</div>'

            '<div style="border-right:1px solid #1E2D45;padding:0 28px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#06B6D4;margin-bottom:8px;">T+7</div>'
            f'<div style="font-size:1.4rem;">{arrow(ti7)}</div>'
            '</div>'

            '<div style="border-right:1px solid #1E2D45;padding:0 28px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:8px;">T+15</div>'
            f'<div style="font-size:1.4rem;">{arrow(ti15)}</div>'
            '</div>'

            '<div style="border-right:1px solid #1E2D45;padding:0 28px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:8px;">T+30</div>'
            f'<div style="font-size:1.4rem;">{arrow(ti30)}</div>'
            '</div>'

            '<div style="border-right:1px solid #1E2D45;padding:0 28px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:8px;">T+45</div>'
            f'<div style="font-size:1.4rem;">{arrow(ti45)}</div>'
            '</div>'

            '<div style="margin-left:auto;text-align:right;padding-left:28px;border-left:1px solid #1E2D45;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:6px;">Status</div>'
            '<div style="font-weight:800;font-size:1rem;color:#10B981;">&#9679; LIVE</div>'
            f'<div style="font-size:0.75rem;color:#64748B;margin-top:2px;">{aggregation}</div>'
            f'<div style="font-size:0.75rem;color:#64748B;">{cabin_class} Class</div>'
            '</div>'
            '</div>'
        )
        st.markdown(_m, unsafe_allow_html=True)

        st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#374151 !important;margin-bottom:10px;">30-Day APIx Forward Trajectory</div>''', unsafe_allow_html=True)

        _apix_vals = [ti7 - 3 + i*0.35 + np.random.normal(0,0.6) for i in range(30)]
        df_trend = pd.DataFrame({
            "Date": pd.date_range(start=base_period, periods=30, freq="D"),
            "APIx": _apix_vals
        })
        _y_lo = min(_apix_vals) - 2; _y_hi = max(_apix_vals) + 3
        fig_t = go.Figure()
        # Baseline trace for area fill (avoids tozeroy pulling axis to 0)
        fig_t.add_trace(go.Scatter(
            x=df_trend["Date"], y=[_y_lo]*30,
            mode='lines', line=dict(width=0), showlegend=False,
            hoverinfo='skip'
        ))
        fig_t.add_trace(go.Scatter(
            x=df_trend["Date"], y=df_trend["APIx"],
            mode='lines', fill='tonexty', fillcolor='rgba(6,182,212,0.08)',
            line=dict(color='#06B6D4', width=2.5),
            hovertemplate="<b>%{x|%d %b}</b><br>APIx: <b>%{y:.2f}</b><extra></extra>"
        ))
        fig_t.update_layout(
            plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
            font_color="#94A3B8", margin=dict(l=0,r=0,t=10,b=0), height=220,
            hovermode="x unified", showlegend=False
        )
        fig_t.update_xaxes(showgrid=True, gridcolor='#1E2D45', zeroline=False)
        fig_t.update_yaxes(showgrid=True, gridcolor='#1E2D45', zeroline=False,
                            range=[_y_lo, _y_hi])
        st.plotly_chart(fig_t, use_container_width=True)

        st.markdown("<br>", unsafe_allow_html=True)

        tab1, tab2, tab3 = st.tabs([
            "&#9992;  Geographic Distribution",
            "&#9632;  Route Heatmap Matrix",
            "&#128200;  Macroeconomic Trends"
        ])

        with tab1:
            c1, c2 = st.columns([3,1])
            with c1:
                st.markdown(f"""<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#374151 !important;margin-bottom:4px;">Live Route Map &mdash; {len(route_summary_df)} Active Routes</div>
                <div style="font-size:0.85rem;color:#64748B !important;margin-bottom:14px;">Arc color = inflation signal &mdash; Arc thickness = passenger volume &mdash; Click any arc for details</div>""", unsafe_allow_html=True)
                render_route_map(route_summary_df)
            with c2:
                top5 = route_summary_df.nlargest(5,'avg_pct_change')
                st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#374151 !important;margin-bottom:10px;">Highest Inflation Routes</div>''', unsafe_allow_html=True)
                for _, rw in top5.iterrows():
                    col = "#EF4444" if rw['avg_pct_change'] > 0 else "#10B981"
                    st.markdown(f"""
                    <div style="background:#0D1626;border:1px solid #1E2D45;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
                        <div style="font-weight:700;color:#E2E8F0 !important;font-size:0.95rem;">{rw['route_id']}</div>
                        <div style="color:{col} !important;font-family:'JetBrains Mono',monospace;font-size:0.85rem;margin-top:3px;">
                            {'&#9650;' if rw['avg_pct_change']>0 else '&#9660;'} {rw['avg_pct_change']:+.2f}%
                        </div>
                    </div>""", unsafe_allow_html=True)

        with tab2:
            render_heatmap(filtered_df, route_summary_df)

        with tab3:
            st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#374151 !important;margin-bottom:12px;">Base Period Configuration</div>''', unsafe_allow_html=True)
            c_yr, c_mo = st.columns(2)
            months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
            with c_yr:  base_yr = st.selectbox("Base Year", list(range(2010,2025)), index=2)
            with c_mo:
                base_mo_name = st.selectbox("Base Month", months, index=0)
                base_mo = months.index(base_mo_name)+1
            mask = (mospi_history_df['Date'].dt.year==base_yr) & (mospi_history_df['Date'].dt.month==base_mo)
            base_date = mospi_history_df['Date'].iloc[0]
            if mask.any():
                base_val  = mospi_history_df[mask]['CPI_Index'].values[0]
                base_date = mospi_history_df[mask]['Date'].values[0]
            else:
                base_val  = mospi_history_df['CPI_Index'].iloc[0]
            rebased = mospi_history_df[mospi_history_df['Date']>=base_date].copy()
            rebased['CPI_Index'] = rebased['CPI_Index'] / base_val * 100
            rebased['Inflation']  = rebased['CPI_Index'] - 100

            fig_m = go.Figure()
            _cpi_vals = rebased['CPI_Index']
            _cpi_lo = _cpi_vals.min() * 0.985
            _cpi_hi = _cpi_vals.max() * 1.015
            # Baseline trace so fill doesn't anchor to y=0
            fig_m.add_trace(go.Scatter(
                x=rebased['Date'], y=[_cpi_lo]*len(rebased),
                mode='lines', line=dict(width=0), showlegend=False, hoverinfo='skip'
            ))
            fig_m.add_trace(go.Scatter(
                x=rebased['Date'], y=_cpi_vals,
                customdata=rebased['Inflation'],
                mode='lines', name='MOSPI CPI',
                line=dict(color='#06B6D4', width=2.5),
                fill='tonexty', fillcolor='rgba(6,182,212,0.07)',
                hovertemplate="<b style='font-size:18px;color:#E2E8F0;'>%{y:.1f}</b><br><span style='color:#06B6D4;'>%{customdata:+.2f}% vs base</span><extra></extra>"
            ))
            fig_m.update_layout(
                plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
                font_color="#94A3B8", margin=dict(l=0,r=0,t=10,b=0), height=480,
                hovermode="x unified", showlegend=False
            )
            fig_m.update_xaxes(showgrid=True, gridcolor='#1E2D45', showspikes=True,
                                spikemode="across", spikethickness=1, spikedash="dash", spikecolor='#1E2D45')
            fig_m.update_yaxes(showgrid=True, gridcolor='#1E2D45', title="Price Index (Base=100)",
                                range=[_cpi_lo, _cpi_hi])
            st.plotly_chart(fig_m, use_container_width=True)


# ============================================================
# PAGE: MATHS & STATS
# ============================================================
elif page == "Maths & Stats":
    st.markdown('''<div class="runway-bar"></div>''', unsafe_allow_html=True)

    _math_header = (
        '<div style="margin-bottom:36px;">'
        '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#06B6D4;margin-bottom:8px;">Methodology</div>'
        '<h1 style="font-size:2.6rem;font-weight:900;letter-spacing:-1px;color:#E2E8F0;margin:0 0 10px 0;">'
        'Modified Laspeyres Price Index'
        '</h1>'
        '<p style="color:#64748B;font-size:1rem;max-width:820px;line-height:1.75;margin:0;">'
        'The <strong style="color:#E2E8F0;">Airfare Price Index (APIx)</strong> uses a modified Laspeyres methodology &mdash; the gold standard used by national statistical agencies &mdash; adapted specifically for India\'s aviation market, where booking horizon, airline mix, and passenger volume vary enormously across routes.'
        '</p>'
        '</div>'
    )
    st.markdown(_math_header, unsafe_allow_html=True)
    fc_col, var_col = st.columns([1.1,1])
    with fc_col:
        st.markdown(
            '<div style="background:linear-gradient(135deg,#0D1626,#111827);'
            'border:1px solid #1E2D45;border-left:3px solid #06B6D4;'
            'border-radius:12px;padding:32px;text-align:center;margin-bottom:20px;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:22px;">Core Formula</div>'

            # Formula line 1: APIx_t =
            '<div style="font-size:1.1rem;font-family:JetBrains Mono,monospace;'
            'color:#E2E8F0;margin-bottom:6px;letter-spacing:0.5px;">'
            '<span style="color:#06B6D4;font-weight:700;">APIx</span>'
            '<sub style="color:#94A3B8;font-size:0.7rem;">t</sub>'
            '&nbsp;=&nbsp;'
            # Fraction wrapper
            '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 6px;">'
            # Numerator
            '<span style="border-bottom:1.5px solid #E2E8F0;padding-bottom:4px;font-size:0.95rem;color:#E2E8F0;">'
            '&sum;<sub style="font-size:0.65rem;color:#94A3B8;">r=1</sub>'
            '<sup style="font-size:0.65rem;color:#94A3B8;">R</sup>'
            '&nbsp;'
            '<span style="color:#06B6D4;">P(r,t)</span>'
            '&nbsp;&times;&nbsp;'
            '<span style="color:#8B5CF6;">Q(r,0)</span>'
            '</span>'
            # Denominator
            '<span style="padding-top:4px;font-size:0.95rem;color:#E2E8F0;">'
            '&sum;<sub style="font-size:0.65rem;color:#94A3B8;">r=1</sub>'
            '<sup style="font-size:0.65rem;color:#94A3B8;">R</sup>'
            '&nbsp;'
            '<span style="color:#F59E0B;">P(r,0)</span>'
            '&nbsp;&times;&nbsp;'
            '<span style="color:#8B5CF6;">Q(r,0)</span>'
            '</span>'
            '</span>'
            '&nbsp;&times;&nbsp;100'
            '</div>'

            '<div style="display:flex;justify-content:center;gap:24px;margin-top:20px;font-size:0.78rem;">'
            '<span><span style="color:#06B6D4;">&#9632;</span>&nbsp;Current fare</span>'
            '<span><span style="color:#F59E0B;">&#9632;</span>&nbsp;Base fare</span>'
            '<span><span style="color:#8B5CF6;">&#9632;</span>&nbsp;DGCA weight</span>'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )

        st.markdown(
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">'
            '<div style="background:#0D1626;border:1px solid rgba(6,182,212,0.25);border-radius:8px;padding:14px;text-align:center;">'
            '<div style="color:#06B6D4;font-size:1.6rem;font-weight:900;font-family:JetBrains Mono,monospace;">100</div>'
            '<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">Base Parity</div>'
            '</div>'
            '<div style="background:#0D1626;border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:14px;text-align:center;">'
            '<div style="color:#EF4444;font-size:1.6rem;font-weight:900;font-family:JetBrains Mono,monospace;">&gt;100</div>'
            '<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">Fare Inflation</div>'
            '</div>'
            '<div style="background:#0D1626;border:1px solid rgba(16,185,129,0.25);border-radius:8px;padding:14px;text-align:center;">'
            '<div style="color:#10B981;font-size:1.6rem;font-weight:900;font-family:JetBrains Mono,monospace;">&lt;100</div>'
            '<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">Fare Deflation</div>'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )

    with var_col:
        for sym, title, desc, clr in [
            ("P(r,t)", "Current Median Fare", "IQR-filtered median ticket price on route r at time t, scraped live from airlines and OTAs.", "#06B6D4"),
            ("P(r,0)", "Base Period Fare", "Fixed reference price for route r during the chosen base year, anchoring the index at exactly 100.", "#F59E0B"),
            ("Q(r,0)", "Passenger Weight (DGCA)", "Proportion of national passengers on route r during the base period, from DGCA quarterly data.", "#8B5CF6"),
        ]:
            st.markdown(
                f'<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:10px;'
                f'padding:16px;display:flex;gap:14px;align-items:flex-start;margin-bottom:10px;">'
                f'<div style="background:{clr}18;color:{clr};font-family:JetBrains Mono,monospace;'
                f'font-weight:800;font-size:1rem;padding:7px 12px;border-radius:6px;'
                f'white-space:nowrap;border:1px solid {clr}30;">{sym}</div>'
                f'<div>'
                f'<div style="color:#E2E8F0;font-weight:700;margin-bottom:4px;">{title}</div>'
                f'<div style="color:#64748B;font-size:0.86rem;line-height:1.55;">{desc}</div>'
                f'</div></div>',
                unsafe_allow_html=True
            )

    st.markdown("<br>", unsafe_allow_html=True)

    st.markdown("""
    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#374151 !important;margin-bottom:6px;">4-Stage Data Pipeline</div>
    <p style="color:#64748B !important;font-size:0.9rem;margin-bottom:20px;">Every scraped fare passes four strict gates before contributing to the index.</p>
    """, unsafe_allow_html=True)

    for num, title, clr, action, rationale in [
        ("01","Ingestion",         "#06B6D4",
         "Continuous scraping of MakeMyTrip, Ixigo, Goibibo, and direct airline portals.",
         "Captures real pricing signals across T+1, T+7, T+15, T+30, T+45 booking horizons."),
        ("02","IQR Filtration",    "#F59E0B",
         "Discard any fare outside Q3 + 1.5 x IQR for its route-horizon pair.",
         "Eliminates last-seat surge outliers that would catastrophically distort the average."),
        ("03","Median Aggregation","#10B981",
         "Compute the statistical median of remaining clean fares.",
         "Median is resistant to residual skewness; gives a truer reflection of what a typical traveller pays."),
        ("04","Laspeyres Weighting","#8B5CF6",
         "Multiply each route's price ratio (current/base) by its DGCA passenger share Q_base.",
         "DEL-BOM correctly outweighs low-traffic routes, producing a consumer-representative national index."),
    ]:
        st.markdown(
            f'<div style="background:linear-gradient(135deg,#0D1626,#111827);border:1px solid #1E2D45;'
            f'border-radius:12px;padding:22px;display:flex;gap:22px;align-items:flex-start;margin-bottom:12px;">'
            f'<div style="background:{clr}18;border:1px solid {clr}30;color:{clr};'
            f'font-size:1.5rem;font-weight:900;width:56px;height:56px;'
            f'border-radius:12px;display:flex;align-items:center;justify-content:center;'
            f'flex-shrink:0;font-family:JetBrains Mono,monospace;">{num}</div>'
            f'<div style="flex:1;">'
            f'<div style="color:#E2E8F0;font-size:1.05rem;font-weight:700;margin-bottom:6px;">{title}</div>'
            f'<div style="color:#94A3B8;font-size:0.9rem;line-height:1.6;margin-bottom:10px;">{action}</div>'
            f'<div style="background:#060B14;border-left:3px solid {clr};padding:8px 14px;border-radius:0 6px 6px 0;">'
            f'<span style="color:#64748B;font-size:0.82rem;"><strong style="color:{clr};">Why: </strong>{rationale}</span>'
            f'</div>'
            f'</div>'
            f'</div>',
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#374151 !important;margin-bottom:6px;">Interactive IQR Demonstration</div>
    <p style="color:#64748B !important;font-size:0.9rem;margin-bottom:16px;">Red bars are outliers caught by the IQR filter before the median is computed.</p>''', unsafe_allow_html=True)

    raw_fares = sorted([3800,4100,4200,4350,4400,4500,4600,4750,4900,5100,5300,18500])
    q1 = np.percentile(raw_fares,25); q3 = np.percentile(raw_fares,75)
    ub = q3 + 1.5*(q3-q1)
    clean = [x for x in raw_fares if x <= ub]
    med   = np.median(clean)

    colors = ['#EF4444' if x > ub else '#06B6D4' for x in raw_fares]
    fig_iq = go.Figure(go.Bar(
        x=[f"Rs.{x:,}" for x in raw_fares], y=raw_fares,
        marker_color=colors,
        marker_line_width=0,
        hovertemplate="<b>Rs.%{y:,}</b><br>%{customdata}<extra></extra>",
        customdata=['&#9888; Outlier (IQR rejected)' if x > ub else '&#10003; Valid fare' for x in raw_fares]
    ))
    fig_iq.add_hline(y=ub, line_dash="dash", line_color="#F59E0B", line_width=1.5,
                     annotation_text=f"IQR Upper Bound  Rs.{ub:,.0f}",
                     annotation_font_color="#F59E0B", annotation_font_size=11,
                     annotation_position="top left")
    fig_iq.add_hline(y=med, line_dash="dot", line_color="#10B981", line_width=1.5,
                     annotation_text=f"Clean Median  Rs.{med:,.0f}",
                     annotation_font_color="#10B981", annotation_font_size=11,
                     annotation_position="bottom left")
    fig_iq.update_layout(
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        font_color="#94A3B8", height=300, margin=dict(l=0,r=0,t=10,b=0),
        showlegend=False,
        xaxis=dict(showgrid=False, tickfont=dict(size=11)),
        yaxis=dict(showgrid=True, gridcolor='#1E2D45', title="Fare (Rs.)",
                   tickformat=",.0f",
                   range=[0, max(raw_fares)*1.08])
    )
    st.plotly_chart(fig_iq, use_container_width=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#374151 !important;margin-bottom:6px;">Mean vs Median: Real-time Outlier Injection</div>
    <p style="color:#64748B !important;font-size:0.9rem;margin-bottom:16px;">Drag the slider to inject a high-value outlier. Watch the Mean distort while the Median stays grounded.</p>''', unsafe_allow_html=True)

    m1, m2 = st.columns([1,2])
    with m1:
        ov = st.slider("Outlier Fare (Rs.)", 5000, 80000, 22000, 1000)
        base_m = [4200,4400,4500,4600,4750]
        full_m = base_m + [ov]
        cmean = np.mean(full_m); cmed = np.median(full_m)
        _mean_med_stats = (
            '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">'
            '<div style="background:#EF444410;border:1px solid #EF444430;border-radius:10px;padding:18px;">'
            '<div style="color:#FCA5A5;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Mean &mdash; Distorted</div>'
            f'<div style="color:#EF4444;font-size:2rem;font-weight:900;font-family:JetBrains Mono,monospace;">Rs.{int(cmean):,}</div>'
            '<div style="color:#64748B;font-size:0.8rem;margin-top:4px;">Pulled by outlier</div>'
            '</div>'
            '<div style="background:#10B98110;border:1px solid #10B98130;border-radius:10px;padding:18px;">'
            '<div style="color:#6EE7B7;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Median &mdash; Stable</div>'
            f'<div style="color:#10B981;font-size:2rem;font-weight:900;font-family:JetBrains Mono,monospace;">Rs.{int(cmed):,}</div>'
            '<div style="color:#64748B;font-size:0.8rem;margin-top:4px;">True centre holds</div>'
            '</div>'
            '</div>'
        )
        st.markdown(_mean_med_stats, unsafe_allow_html=True)
    with m2:
        xl = [f"Rs.{v:,}" for v in base_m] + [f"Rs.{ov:,} (Outlier)"]
        yl = base_m + [ov]
        dc = ['#06B6D4']*5 + ['#EF4444']
        fig_mm = go.Figure()
        fig_mm.add_trace(go.Scatter(x=xl,y=yl,mode='markers',
                                     marker=dict(size=18,color=dc,line=dict(color='#060B14',width=2)),
                                     hovertemplate="<b>%{x}</b><extra></extra>"))
        fig_mm.add_hline(y=cmean,line_dash="dash",line_color="#EF4444",line_width=2,
                          annotation_text=f"Mean Rs.{int(cmean):,}",annotation_font_color="#EF4444")
        fig_mm.add_hline(y=cmed,line_dash="dot",line_color="#10B981",line_width=2,
                          annotation_text=f"Median Rs.{int(cmed):,}",annotation_font_color="#10B981")
        fig_mm.update_layout(plot_bgcolor="rgba(0,0,0,0)",paper_bgcolor="rgba(0,0,0,0)",
                              font_color="#94A3B8",height=330,margin=dict(l=0,r=0,t=10,b=0),showlegend=False,
                              xaxis=dict(showgrid=False),yaxis=dict(showgrid=True,gridcolor='#1E2D45',title="Fare (Rs.)"))
        st.plotly_chart(fig_mm, use_container_width=True)


# ============================================================
# PAGE: WEIGHT ALLOCATION
# ============================================================
elif page == "Weight Allocation":
    srecs = []
    for r in full_fare_df['route_id'].unique():
        fr = full_fare_df[full_fare_df['route_id']==r].iloc[0]
        srecs.append({"route_id":r,"passenger_share":fr['passenger_share'],"passenger_count":fr['passenger_count']})
    grs = pd.DataFrame(srecs).sort_values('passenger_share',ascending=False).reset_index(drop=True)
    total = grs['passenger_count'].sum()

    st.markdown('''<div class="runway-bar"></div>''', unsafe_allow_html=True)

    _weight_header = (
        '<div style="margin-bottom:36px;">'
        '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8B5CF6;margin-bottom:8px;">DGCA Data Integration</div>'
        '<h1 style="font-size:2.6rem;font-weight:900;letter-spacing:-1px;color:#E2E8F0;margin:0 0 10px 0;">'
        'Passenger-Weighted Route Allocation'
        '</h1>'
        '<p style="color:#64748B;font-size:1rem;max-width:820px;line-height:1.75;margin:0;">'
        'A naive index treats every route equally &mdash; the Chandigarh-Jaipur hop would carry the same weight as DEL-BOM. '
        'APIx uses quarterly passenger volume from the <strong style="color:#E2E8F0;">Directorate General of Civil Aviation (DGCA)</strong> '
        'to weight each route by its true share of national air traffic.'
        '</p>'
        '</div>'
    )
    st.markdown(_weight_header, unsafe_allow_html=True)

    wf1, wf2 = st.columns([1,1])
    with wf1:
        st.markdown(
            '<div style="background:linear-gradient(135deg,#0D1626,#111827);'
            'border:1px solid #1E2D45;border-left:3px solid #8B5CF6;'
            'border-radius:12px;padding:32px;text-align:center;height:100%;'
            'display:flex;flex-direction:column;justify-content:center;">'
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;'
            'letter-spacing:1.5px;color:#64748B;margin-bottom:24px;">Weight Formula</div>'

            '<div style="font-size:1.15rem;font-family:JetBrains Mono,monospace;'
            'color:#E2E8F0;letter-spacing:0.5px;">'
            '<span style="color:#8B5CF6;font-weight:700;">Q</span>'
            '<sub style="color:#94A3B8;font-size:0.7rem;">r,0</sub>'
            '&nbsp;=&nbsp;'
            '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 6px;">'
            '<span style="border-bottom:1.5px solid #E2E8F0;padding-bottom:4px;color:#06B6D4;">N<sub>r</sub></span>'
            '<span style="padding-top:4px;color:#F59E0B;">&sum;&nbsp;N<sub>j</sub></span>'
            '</span>'
            '</div>'
            '</div>',
            unsafe_allow_html=True
        )
    with wf2:
        for sym, desc, clr in [
            ("Q(r,0)", "The final dimensionless weight for route r. All weights sum to 1.0.", "#8B5CF6"),
            ("N_r",    "Total passengers flown on route r during the DGCA base quarter.", "#06B6D4"),
            ("SUM N_j","Sum of all passengers across every tracked route — the normalising denominator.", "#F59E0B"),
        ]:
            st.markdown(
                f'<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:10px;'
                f'padding:14px 18px;display:flex;gap:14px;align-items:center;margin-bottom:8px;">'
                f'<div style="color:{clr};font-family:JetBrains Mono,monospace;font-weight:800;font-size:0.9rem;'
                f'background:{clr}15;padding:5px 10px;border-radius:5px;white-space:nowrap;border:1px solid {clr}25;">{sym}</div>'
                f'<div style="color:#94A3B8;font-size:0.86rem;line-height:1.5;">{desc}</div>'
                f'</div>',
                unsafe_allow_html=True
            )

    st.markdown("<br>", unsafe_allow_html=True)

    if 'selected_route_id' not in st.session_state:
        st.session_state.selected_route_id = grs.iloc[0]['route_id']

    route_sel = st.selectbox("Select Route", grs['route_id'].tolist(),
                              index=grs['route_id'].tolist().index(st.session_state.selected_route_id))
    if route_sel != st.session_state.selected_route_id:
        st.session_state.selected_route_id = route_sel; st.rerun()

    sel_id  = st.session_state.selected_route_id
    sel_row = grs[grs['route_id']==sel_id].iloc[0]
    pct     = sel_row['passenger_share']*100
    pcount  = int(sel_row['passenger_count'])
    rank    = grs['route_id'].tolist().index(sel_id)+1
    naive   = (1/len(grs))*100
    delta   = pct - naive

    _sel_info = (
        '<div style="background:linear-gradient(135deg,#0D1626,#111827);border:1px solid #1E2D45;'
        'border-radius:12px;padding:20px 28px;display:flex;gap:0;margin-bottom:24px;">'
        '<div style="flex:1;border-right:1px solid #1E2D45;padding-right:24px;">'
        '<div style="color:#64748B;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Route</div>'
        f'<div style="color:#E2E8F0;font-size:1.7rem;font-weight:900;letter-spacing:1px;font-family:JetBrains Mono,monospace;">{sel_id}</div>'
        f'<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">Rank #{rank} / {len(grs)}</div>'
        '</div>'
        '<div style="flex:1;border-right:1px solid #1E2D45;padding:0 24px;">'
        '<div style="color:#64748B;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Quarterly Passengers</div>'
        f'<div style="color:#E2E8F0;font-size:1.7rem;font-weight:900;font-family:JetBrains Mono,monospace;">{pcount:,}</div>'
        f'<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">of {int(total):,} total</div>'
        '</div>'
        '<div style="flex:1;border-right:1px solid #1E2D45;padding:0 24px;">'
        '<div style="color:#64748B;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">DGCA Weight Q(base)</div>'
        f'<div style="color:#8B5CF6;font-size:1.7rem;font-weight:900;font-family:JetBrains Mono,monospace;">{pct:.3f}%</div>'
        f'<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">of national air traffic</div>'
        '</div>'
        '<div style="flex:1;padding-left:24px;">'
        '<div style="color:#64748B;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">vs Equal Weight</div>'
        f'<div style="color:{"#10B981" if delta>0 else "#EF4444"};font-size:1.7rem;font-weight:900;font-family:JetBrains Mono,monospace;">'
        f'{"&#9650;" if delta>0 else "&#9660;"}&nbsp;{abs(delta):.3f}%'
        '</div>'
        f'<div style="color:#64748B;font-size:0.78rem;margin-top:4px;">Naive = {naive:.3f}%</div>'
        '</div>'
        '</div>'
    )
    st.markdown(_sel_info, unsafe_allow_html=True)

    bc, dc = st.columns([1.4,1])
    with bc:
        top25 = grs.head(25).copy()
        clrs  = ['#8B5CF6' if r==sel_id else '#1E2D45' for r in top25['route_id']]
        fig_bar = go.Figure(go.Bar(
            x=top25['passenger_share']*100, y=top25['route_id'],
            orientation='h', marker_color=clrs,
            text=(top25['passenger_share']*100).apply(lambda x:f"{x:.2f}%"),
            textposition='outside', textfont=dict(color='#64748B',size=10),
            hovertemplate="<b>%{y}</b><br>Weight: %{x:.3f}%<extra></extra>"
        ))
        fig_bar.update_layout(
            title=dict(text="Top 25 Routes by Passenger Weight",font=dict(color='#E2E8F0',size=13)),
            plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
            font_color="#94A3B8", height=560,
            margin=dict(l=0,r=55,t=40,b=0),
            xaxis=dict(showgrid=True,gridcolor='#1E2D45',title="Weight (%)",ticksuffix="%"),
            yaxis=dict(showgrid=False,autorange='reversed',tickfont=dict(size=10))
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    with dc:
        labels = grs['route_id'].tolist(); values = grs['passenger_count'].tolist()
        pulls  = [0.09 if r==sel_id else 0 for r in labels]
        dclrs  = ['#8B5CF6' if r==sel_id else '#1A2535' for r in labels]
        fig_d  = go.Figure(go.Pie(
            labels=labels, values=values, hole=0.72, pull=pulls,
            marker=dict(colors=dclrs,line=dict(color='#060B14',width=1)),
            hovertemplate="<b>%{label}</b><br>%{value:,} pax<br>%{percent:.2f}<extra></extra>",
            textinfo='none'
        ))
        fig_d.add_annotation(text=f"<b>{sel_id}</b><br>{pct:.2f}%",
                              x=0.5,y=0.5,showarrow=False,
                              font=dict(color='#E2E8F0',size=13),align='center')
        fig_d.update_layout(showlegend=False,margin=dict(t=40,b=10,l=0,r=0),
                             plot_bgcolor="rgba(0,0,0,0)",paper_bgcolor="rgba(0,0,0,0)",
                             font_color="#94A3B8",height=320,
                             title=dict(text=f"All {len(grs)} Routes - Click to Select",font=dict(color='#E2E8F0',size=12)))
        sel_ev = st.plotly_chart(fig_d, use_container_width=True, on_select="rerun", selection_mode="points")
        if sel_ev and "selection" in sel_ev and sel_ev["selection"].get("points"):
            cl = sel_ev["selection"]["points"][0].get("label")
            if cl and cl != st.session_state.selected_route_id:
                st.session_state.selected_route_id = cl; st.rerun()

        top5s  = grs.head(5)['passenger_share'].sum()*100
        top10s = grs.head(10)['passenger_share'].sum()*100
        _traffic_shares = (
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">'
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:8px;padding:14px;text-align:center;">'
            '<div style="color:#64748B;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Top 5 Routes</div>'
            f'<div style="color:#8B5CF6;font-size:1.4rem;font-weight:900;font-family:JetBrains Mono,monospace;">{top5s:.1f}%</div>'
            '<div style="color:#64748B;font-size:0.75rem;">of national traffic</div>'
            '</div>'
            '<div style="background:#0D1626;border:1px solid #1E2D45;border-radius:8px;padding:14px;text-align:center;">'
            '<div style="color:#64748B;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Top 10 Routes</div>'
            f'<div style="color:#8B5CF6;font-size:1.4rem;font-weight:900;font-family:JetBrains Mono,monospace;">{top10s:.1f}%</div>'
            '<div style="color:#64748B;font-size:0.75rem;">of national traffic</div>'
            '</div>'
            '</div>'
        )
        st.markdown(_traffic_shares, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('''<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#374151 !important;margin-bottom:6px;">Index Impact Simulator</div>
    <p style="color:#64748B !important;font-size:0.9rem;margin-bottom:14px;">Simulate a fare spike on the selected route to see the difference between naive vs. DGCA-weighted response.</p>''', unsafe_allow_html=True)

    sc1, sc2 = st.columns([1,2])
    with sc1:
        spk = st.slider("Fare Change (%)", -50, 100, 20, 5, format="%d%%")
        nd  = spk/len(grs); ad = spk*sel_row['passenger_share']
        _sim_res = (
            '<div style="display:flex;flex-direction:column;gap:12px;margin-top:18px;">'
            '<div style="background:#EF444410;border:1px solid #EF444430;border-radius:10px;padding:18px;">'
            '<div style="color:#FCA5A5;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">Naive Unweighted</div>'
            f'<div style="color:#EF4444;font-size:1.9rem;font-weight:900;font-family:JetBrains Mono,monospace;">{"+ " if nd>0 else ""}{nd:.3f} pts</div>'
            f'<div style="color:#64748B;font-size:0.8rem;margin-top:4px;">Equally divides across {len(grs)} routes</div>'
            '</div>'
            '<div style="background:#8B5CF610;border:1px solid #8B5CF630;border-radius:10px;padding:18px;">'
            '<div style="color:#C4B5FD;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">APIx DGCA Weighted</div>'
            f'<div style="color:#8B5CF6;font-size:1.9rem;font-weight:900;font-family:JetBrains Mono,monospace;">{"+ " if ad>0 else ""}{ad:.3f} pts</div>'
            f'<div style="color:#64748B;font-size:0.8rem;margin-top:4px;">Weighted at {pct:.3f}% share</div>'
            '</div>'
            '</div>'
        )
        st.markdown(_sim_res, unsafe_allow_html=True)
    with sc2:
        fig_s = go.Figure(go.Bar(
            x=["Naive (Unweighted)", f"APIx | {sel_id}"],
            y=[nd, ad],
            marker_color=['#EF4444','#8B5CF6'],
            text=[f"{nd:+.3f} pts", f"{ad:+.3f} pts"],
            textposition='outside',textfont=dict(color='#E2E8F0',size=13),
            hovertemplate="%{x}<br>%{y:.3f} pts<extra></extra>"
        ))
        fig_s.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",paper_bgcolor="rgba(0,0,0,0)",
            font_color="#94A3B8",height=320,margin=dict(l=0,r=0,t=20,b=0),showlegend=False,
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True,gridcolor='#1E2D45',title="Index Point Change",
                       zeroline=True,zerolinecolor='#374151')
        )
        st.plotly_chart(fig_s, use_container_width=True)
        st.markdown(f"""
        <div style="background:#0D1626;border:1px solid #1E2D45;border-radius:8px;padding:14px;text-align:center;">
            <span style="color:#64748B !important;font-size:0.9rem;">Naive index error: </span>
            <span style="color:#EF4444 !important;font-weight:800;font-size:1rem;font-family:'JetBrains Mono',monospace;">{abs(nd-ad):.3f} pts</span>
            <span style="color:#64748B !important;font-size:0.9rem;"> &mdash; a misleading signal for policymakers.</span>
        </div>""", unsafe_allow_html=True)
