import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

st.set_page_config(page_title="APIx Dashboard | Operate", layout="wide", initial_sidebar_state="expanded")

# --- CUSTOM CSS: True Pastel Glassmorphism ---
st.markdown("""
<style>
    /* 1. Base Typography & Mesh Gradient */
    .stApp {
        background-color: #fdfbfb;
        background-image: 
            radial-gradient(at 40% 20%, hsla(28, 100%, 74%, 0.45) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.45) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.65) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 0.45) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 0.45) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(242, 100%, 70%, 0.45) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.45) 0px, transparent 50%);
        background-attachment: fixed;
        /* Apple Typography: system fonts naturally support optical sizing */
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    header[data-testid="stHeader"] {
        background: transparent !important;
    }

    /* 2. Materials & Depth (Hierarchy through Translucency) */
    /* Sidebar: Heavier structural layer */
    [data-testid="stSidebar"] {
        background: rgba(255, 255, 255, 0.4) !important;
        backdrop-filter: blur(24px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.5) !important;
    }

    /* Panels: Lighter functional layer */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background: rgba(255, 255, 255, 0.6) !important;
        backdrop-filter: blur(16px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
        /* Top border catching light */
        border: 1px solid rgba(255, 255, 255, 0.4) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.8) !important;
        border-radius: 24px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        padding: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        /* 3. Feedback: Continuous & Interruptible (Simulated via ease-out) */
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease-out !important;
        will-change: transform;
    }
    
    /* 1:1 Tracking & Response: Instant feedback on interaction */
    [data-testid="stVerticalBlockBorderWrapper"]:active {
        transform: scale(0.985) !important;
        transition: transform 0.1s ease-out !important; /* Fast down, spring up */
    }

    /* 4. Optical Sizing & Tracking */
    .headline-title {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em; /* Small text wants positive tracking */
        color: #4A5568;
        font-weight: 700;
        margin-bottom: -10px;
    }
    .metric-value {
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.05; /* Large text wants tight leading */
        color: #1A202C;
        letter-spacing: -0.02em; /* Large text wants negative tracking */
        font-optical-sizing: auto;
    }
    .metric-delta {
        color: #276749;
        font-weight: 600; /* Backed off weight to establish hierarchy vs value */
        font-size: 1.25rem;
        background: rgba(154, 230, 180, 0.3);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(154, 230, 180, 0.5);
        vertical-align: middle;
        margin-left: 10px;
    }
    
    .js-plotly-plot .plotly .bg {
        fill: transparent !important;
    }

    /* 5. Reduced Motion & Accessibility */
    @media (prefers-reduced-motion: reduce) {
        [data-testid="stVerticalBlockBorderWrapper"] {
            transition: none !important;
        }
        [data-testid="stVerticalBlockBorderWrapper"]:active {
            transform: none !important; /* No scaling */
            opacity: 0.8; /* Replaced with gentle opacity feedback */
        }
    }
    
    @media (prefers-reduced-transparency: reduce) {
        .stApp {
            background-image: none !important;
            background-color: #f5f5f7 !important;
        }
        [data-testid="stSidebar"], [data-testid="stVerticalBlockBorderWrapper"] {
            background: #ffffff !important;
            backdrop-filter: none !important;
            border: 1px solid #d2d2d7 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        }
    }
</style>
""", unsafe_allow_html=True)

# --- MOCK DATA ---
dates = pd.date_range(start="2023-11-01", end="2024-10-31", freq='ME')
values = [118.5, 118.5, 118.5, 118.4, 121.8, 121.3, 122.7, 122.37, 123.5, 126.35, 127.05, 127.78, 128.45]
df_trend = pd.DataFrame({"Date": dates, "APIx": values[:len(dates)]})

routes = ["DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-HYD", "BOM-GOI", "DEL-CCU"]
horizons = ["T+1", "T+7", "T+15", "T+30", "T+45"]
heatmap_data = np.random.randint(4000, 15000, size=(len(routes), len(horizons)))
df_heatmap = pd.DataFrame(heatmap_data, index=routes, columns=horizons)

# --- SIDEBAR ---
with st.sidebar:
    st.markdown("### 📊 APIx Navigation")
    st.radio("", ["Operate", "Trends", "Data Dictionary", "Methodology"], index=0, label_visibility="collapsed")
    st.markdown("<br>", unsafe_allow_html=True)
    
    st.markdown("### 🛡️ Data Quality")
    with st.container(border=True):
        st.markdown("**Missing Data Flags**")
        st.error("🚩 BOM-BLR (T+1) - Critical")
        st.warning("🚩 DEL-HYD (T+30) - Warning")
        st.warning("🚩 DEL-CCU (T+7) - Warning")
        
    with st.container(border=True):
        st.markdown("**Collection Stats**")
        st.markdown("Total Scraped: **14,250**")
        st.markdown("Outliers Filtered: **2.4%**")
        st.markdown("Update: **15:32 GMT**")

# --- MAIN DASHBOARD ---
with st.container(border=True):
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown('<p class="headline-title">APIx Economic Index (Oct 2024)</p>', unsafe_allow_html=True)
        st.markdown('<span class="metric-value">128.45</span><span class="metric-delta">+3.12% YoY</span>', unsafe_allow_html=True)
    with col2:
        st.markdown("<div style='text-align:right; margin-top:20px;'>", unsafe_allow_html=True)
        st.markdown("**Status: LIVE**<br><span style='color:#718096'>Real-Time Macro Aggregate</span>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

with st.container(border=True):
    st.markdown("#### APIx 12-Month Trend (2023-2024)")
    fig = px.area(df_trend, x="Date", y="APIx", markers=True)
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=20, b=0),
        yaxis=dict(range=[115, 130], gridcolor="rgba(0,0,0,0.05)"),
        xaxis=dict(gridcolor="rgba(0,0,0,0)"),
        font_color="#2D3748"
    )
    fig.update_traces(line_color="#3182CE", fillcolor="rgba(49, 130, 206, 0.2)")
    st.plotly_chart(fig, use_container_width=True)

with st.container(border=True):
    st.markdown("#### Route-wise Fare Heatmap (INR)")
    fig_heat = px.imshow(
        df_heatmap,
        labels=dict(x="Booking Horizon", y="Route", color="Median Fare"),
        x=horizons,
        y=routes,
        color_continuous_scale="Teal",
        aspect="auto",
        text_auto=True
    )
    fig_heat.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=20, b=0),
        font_color="#2D3748"
    )
    st.plotly_chart(fig_heat, use_container_width=True)
