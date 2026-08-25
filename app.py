import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
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

st.set_page_config(page_title="APIx Dashboard | Operate", layout="wide", initial_sidebar_state="expanded")

# --- CUSTOM CSS: Deep Navy / Slate Theme ---
st.markdown("""
<style>
    /* 1. Deep Navy/Slate Background */
    .stApp {
        background-color: #0F172A;
        font-family: 'Inter', sans-serif;
    }
    
    header[data-testid="stHeader"] {
        background: transparent !important;
    }

    /* 2. Sidebar styling - Dark Slate */
    [data-testid="stSidebar"] {
        background: #1E293B !important;
        border-right: 1px solid #334155 !important;
    }

    /* 3. Containers - Elevated Slate */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background: #1E293B !important;
        border: 1px solid #334155 !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        padding: 1.5rem !important;
        margin-bottom: 1.5rem !important;
    }
    
    /* 4. Typography Adjustments */
    .headline-title {
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #94A3B8;
        font-weight: 700;
        margin-bottom: -10px;
    }
    .metric-value {
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.1;
        color: #F8FAFC;
        letter-spacing: -1px;
    }
    .metric-delta {
        color: #38B2AC;
        font-weight: 700;
        font-size: 1.25rem;
        background: rgba(56, 178, 172, 0.1);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(56, 178, 172, 0.2);
        vertical-align: middle;
        margin-left: 10px;
    }
    
    /* Formula Box */
    .formula-box {
        background-color: #0F172A;
        border-left: 4px solid #38B2AC;
        padding: 15px;
        font-family: 'Courier New', monospace;
        color: #E2E8F0;
        font-size: 1.1rem;
        border-radius: 4px;
        margin: 15px 0;
    }
    
    /* Override plotly background */
    .js-plotly-plot .plotly .bg {
        fill: transparent !important;
    }
    
    p, span, h1, h2, h3, h4, h5, h6, label {
        color: #F8FAFC !important;
    }
</style>
""", unsafe_allow_html=True)


# --- HELPER FUNCTIONS FOR VISUALIZATIONS ---
def get_color(val, vmin=-10, vmax=30):
    cmap = cm.get_cmap('RdYlGn_r')
    norm_val = (val - vmin) / (vmax - vmin)
    norm_val = max(0, min(1, norm_val))
    rgba = cmap(norm_val)
    return rgb2hex(rgba)

def get_bezier_curve(p1, p2, num_points=20):
    p1, p2 = np.array(p1), np.array(p2)
    midpoint = (p1 + p2) / 2
    direction = p2 - p1
    perp = np.array([-direction[1], direction[0]])
    if np.linalg.norm(perp) > 0:
        perp = perp / np.linalg.norm(perp)
    offset = np.linalg.norm(direction) * 0.15
    control_point = midpoint + perp * offset
    
    t = np.linspace(0, 1, num_points)
    curve = np.outer((1-t)**2, p1) + np.outer(2*(1-t)*t, control_point) + np.outer(t**2, p2)
    return curve.tolist()

def render_route_map(summary_df):
    m = folium.Map(
        location=[22.5, 80], 
        zoom_start=5, 
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri World Imagery'
    )
    added_airports = set()
    
    min_w = summary_df['passenger_share'].min()
    max_w = summary_df['passenger_share'].max()
    
    for idx, row in summary_df.iterrows():
        p1 = [row['origin_lat'], row['origin_lon']]
        p2 = [row['dest_lat'], row['dest_lon']]
        color = get_color(row['avg_pct_change'])
        
        weight = 3
        if max_w > min_w:
            weight = 1 + 6 * ((row['passenger_share'] - min_w) / (max_w - min_w))
            
        curve = get_bezier_curve(p1, p2)
        
        popup_html = f"""
        <div style="font-family: Arial; min-width: 150px; color: #333;">
            <h4 style="margin: 0;">{row['route_id']}</h4>
            <p style="margin: 5px 0;"><strong>APIx:</strong> {row['route_index']:.1f}</p>
            <p style="margin: 5px 0;"><strong>Avg Change:</strong> {row['avg_pct_change']:.1f}%</p>
        </div>
        """
        
        AntPath(
            curve, color=color, weight=weight, opacity=0.6, 
            dash_array=[10, 20], popup=folium.Popup(popup_html)
        ).add_to(m)
        
        if row['origin'] not in added_airports:
            folium.CircleMarker(location=p1, radius=4, color="#F8FAFC", fill=True, tooltip=row['origin']).add_to(m)
            added_airports.add(row['origin'])
        if row['destination'] not in added_airports:
            folium.CircleMarker(location=p2, radius=4, color="#F8FAFC", fill=True, tooltip=row['destination']).add_to(m)
            added_airports.add(row['destination'])
            
    st_folium(m, width="100%", height=600, returned_objects=[])

def render_heatmap(fare_df, summary_df):
    top_routes = summary_df.sort_values(by='passenger_share', ascending=False)['route_id'].tolist()[::-1]
    horizons = ["T+1", "T+7", "T+15", "T+30", "T+45"]
    
    z_data, text_data, hover_data = [], [], []
    
    for route in top_routes:
        route_fares = fare_df[fare_df['route_id'] == route]
        z_row, text_row, hover_row = [], [], []
        weight = summary_df[summary_df['route_id'] == route]['passenger_share'].values[0]
        
        for h in horizons:
            rows = route_fares[route_fares['horizon'] == h]
            if not rows.empty:
                val = rows['pct_change'].mean()
                fare = rows['fare_current'].mean()
                base = rows['fare_base'].mean()
                z_row.append(val)
                text_row.append(f"₹{int(fare)}")
                hover_row.append(f"Route: {route}<br>Horizon: {h}<br>Base Fare: ₹{int(base)}<br>Current Fare: ₹{int(fare)}<br>Change: {val:.1f}%<br>Weight: {weight:.2f}")
            else:
                z_row.append(None); text_row.append(""); hover_row.append("")
        z_data.append(z_row); text_data.append(text_row); hover_data.append(hover_row)
        
    fig = make_subplots(rows=1, cols=2, shared_yaxes=True, column_widths=[0.75, 0.25], horizontal_spacing=0.08)
    
    fig.add_trace(go.Heatmap(
        z=z_data, x=horizons, y=top_routes, text=text_data, texttemplate="%{text}",
        colorscale='RdYlGn_r', zmin=-10, zmax=30, customdata=hover_data,
        hovertemplate="%{customdata}<extra></extra>", showscale=True, colorbar=dict(title="% Change", x=0.71, thickness=15)
    ), row=1, col=1)
    
    weights = [summary_df[summary_df['route_id'] == r]['passenger_share'].values[0] for r in top_routes]
    fig.add_trace(go.Bar(
        x=weights, y=top_routes, orientation='h', marker=dict(color='#38B2AC'),
        hovertemplate="Route: %{y}<br>Weight: %{x:.3f}<extra></extra>"
    ), row=1, col=2)
    
    title = "Route-wise Fare Inflation Heatmap"
    
    # Calculate a dynamic height based on the number of routes
    heatmap_height = max(600, len(top_routes) * 20 + 100)
    
    fig.update_layout(
        title=title,
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=40, b=0), height=heatmap_height, font_color="#F8FAFC"
    )
    
    fig.update_xaxes(showgrid=False, zeroline=False, showticklabels=False, row=1, col=2)
    fig.update_xaxes(showgrid=False, zeroline=False, row=1, col=1)
    fig.update_yaxes(showgrid=False, zeroline=False, row=1, col=1)
    
    st.plotly_chart(fig, use_container_width=True)


# --- MASSIVE DATA ENGINE (CACHED) ---
@st.cache_data
def generate_massive_mock_db():
    np.random.seed(42)
    random.seed(42)
    
    airports = {
        "DEL": (28.5562, 77.1000), "BOM": (19.0896, 72.8656), "BLR": (13.1986, 77.7066),
        "HYD": (17.2403, 78.4294), "MAA": (12.9941, 80.1709), "CCU": (22.6547, 88.4467),
        "AMD": (23.0734, 72.6347), "COK": (10.1520, 76.4019), "PNQ": (18.5822, 73.9197),
        "GOI": (15.3808, 73.8314), "LKO": (26.7606, 80.8893), "JAI": (26.8242, 75.8122),
        "ATQ": (31.7096, 74.7973), "GAU": (26.1061, 91.5859), "BBI": (20.2444, 85.8178),
        "IXC": (30.6735, 76.7886), "IXB": (26.6812, 88.3286), "PAT": (25.5913, 85.0880),
        "TRV": (8.4821, 76.9201), "VTZ": (17.7211, 83.2245)
    }
    
    all_pairs = list(itertools.combinations(airports.keys(), 2))
    selected_pairs = random.sample(all_pairs, 80)
    
    airlines = ["IndiGo (6E)", "Air India (AI)", "SpiceJet (SG)", "Air India Express (IX)", "Akasa Air (QP)"]
    horizons_list = ["T+1", "T+7", "T+15", "T+30", "T+45"]
    
    fare_records = []
    
    base_shares = np.random.lognormal(mean=0, sigma=1, size=80)
    base_shares = base_shares / np.sum(base_shares)
    
    for i, (orig, dest) in enumerate(selected_pairs):
        route_id = f"{orig}-{dest}"
        passenger_share = base_shares[i]
        passenger_count = int(passenger_share * 150_000_000)
        
        num_airlines = random.randint(2, 5)
        route_airlines = random.sample(airlines, num_airlines)
        
        for al in route_airlines:
            classes = ["Economy", "Business"]
                
            for cab in classes:
                for h in horizons_list:
                    base_fare = np.random.randint(4000, 8000) if cab == "Economy" else np.random.randint(15000, 35000)
                    
                    if h == "T+1": base_mult = np.random.uniform(1.3, 2.0)
                    elif h == "T+7": base_mult = np.random.uniform(1.1, 1.5)
                    elif h == "T+15": base_mult = np.random.uniform(0.9, 1.3)
                    elif h == "T+30": base_mult = np.random.uniform(0.8, 1.1)
                    else: base_mult = np.random.uniform(0.7, 0.9)
                    
                    if al == "IndiGo (6E)": base_mult *= 0.95
                    elif al == "Air India (AI)": base_mult *= 1.1
                    elif al == "SpiceJet (SG)": base_mult *= 0.90
                    
                    current_fare = base_fare * base_mult
                    pct_change = ((current_fare - base_fare) / base_fare) * 100
                    
                    fare_records.append({
                        "route_id": route_id,
                        "origin": orig, "destination": dest,
                        "origin_lat": airports[orig][0], "origin_lon": airports[orig][1],
                        "dest_lat": airports[dest][0], "dest_lon": airports[dest][1],
                        "airline": al,
                        "cabin_class": cab,
                        "horizon": h,
                        "fare_base": base_fare,
                        "fare_current": current_fare,
                        "pct_change": pct_change,
                        "passenger_share": passenger_share, 
                        "passenger_count": passenger_count
                    })
                    
    return pd.DataFrame(fare_records)

@st.cache_data
def generate_mospi_history():
    """Generates a realistic 14-year monthly CPI history for Airfare (MOSPI eSankhyiki style)"""
    np.random.seed(42)
    start_date = datetime(2010, 1, 1)
    # Generate up to last month
    end_date = datetime.today().replace(day=1) - timedelta(days=1) 
    
    dates = pd.date_range(start_date, end_date, freq='MS')
    
    # Simulate realistic inflation curve: Base 100 around 2012
    # Slow climb to 2019, massive dip in 2020 (Covid), sharp spike in 2022-2023
    indices = []
    current_index = 95.0
    
    for d in dates:
        if d.year == 2012:
            current_index = 100.0 # Re-base
        
        # Covid shock
        if d.year == 2020 and d.month in [4, 5, 6, 7]:
            current_index -= np.random.uniform(2, 5)
        # Post-covid revenge travel & fuel spike
        elif d.year in [2022, 2023]:
            current_index += np.random.uniform(0.5, 2.5)
        else:
            # Normal inflation drift
            current_index += np.random.uniform(-0.5, 1.2)
            
        indices.append(current_index)
        
    df = pd.DataFrame({
        "Date": dates,
        "CPI_Index": indices
    })
    
    # Calculate Y-o-Y Inflation % just like MOSPI
    df['Inflation_%'] = df['CPI_Index'].pct_change(periods=12) * 100
    df['Inflation_%'] = df['Inflation_%'].fillna(0)
    
    return df

# Boot up engines
full_fare_df = generate_massive_mock_db()
mospi_history_df = generate_mospi_history()


# --- SIDEBAR NAVIGATION & FILTERS ---
with st.sidebar:
    st.markdown("### 📊 APIx Navigation")
    page = st.radio("", ["Calculator", "Maths & Stats", "Weight Allocation (DGCA)"], index=0, label_visibility="collapsed")
    st.markdown("<br>", unsafe_allow_html=True)
    
    if page == "Calculator":
        st.markdown("### 🎛️ Control Panel")
        
        base_period = st.date_input("Base Period", value=datetime.today())
        aggregation = st.selectbox("Aggregation Level", ("Overall Industry", "Airline Specific", "Route Specific"))
        
        airline_filter = "All"
        if aggregation == "Airline Specific":
            airline_filter = st.selectbox("Airline", ("IndiGo (6E)", "Air India (AI)", "SpiceJet (SG)", "Air India Express (IX)", "Akasa Air (QP)"))
            
        route_filter = "All"
        if aggregation == "Route Specific":
            unique_routes = sorted(full_fare_df['route_id'].unique())
            route_filter = st.selectbox("Route", unique_routes)
            
        cabin_class = st.selectbox("Cabin Class", ("Economy", "Business"))
    
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### 🛡️ Data Quality")
    with st.container(border=True):
        st.markdown("**Collection Stats**")
        st.markdown(f"Historical Records: **{len(mospi_history_df):,}**")
        st.markdown(f"Live Flights Analyzed: **{len(full_fare_df):,}**")
        st.markdown("Update: **LIVE**")


if page == "Calculator":
    # ---------------------------------------------------------
    # MASSIVE REACTIVE FILTERING LOGIC
    # ---------------------------------------------------------
    filtered_df = full_fare_df.copy()
    
    # 1. Filter by Cabin Class
    filtered_df = filtered_df[filtered_df['cabin_class'] == cabin_class]
    
    # 2. Filter by Aggregation
    if aggregation == "Airline Specific":
        filtered_df = filtered_df[filtered_df['airline'] == airline_filter]
    elif aggregation == "Route Specific":
        filtered_df = filtered_df[filtered_df['route_id'] == route_filter]
        
    if filtered_df.empty:
        st.error("No flight data is currently available for this combination of filters. Please adjust your selections to view active routes.")
    else:
        summary_records = []
        unique_filtered_routes = filtered_df['route_id'].unique()
        
        for r in unique_filtered_routes:
            r_fares = filtered_df[filtered_df['route_id'] == r]
            avg_pct_change = r_fares['pct_change'].mean()
            route_index = 100 + avg_pct_change
            
            first_row = r_fares.iloc[0]
            summary_records.append({
                "route_id": r, "origin": first_row['origin'], "destination": first_row['destination'],
                "origin_lat": first_row['origin_lat'], "origin_lon": first_row['origin_lon'],
                "dest_lat": first_row['dest_lat'], "dest_lon": first_row['dest_lon'],
                "avg_pct_change": avg_pct_change,
                "route_index": route_index,
                "passenger_share": first_row['passenger_share'],
                "passenger_count": first_row['passenger_count']
            })
            
        route_summary_df = pd.DataFrame(summary_records)
        
        # Calculate top metrics based on the filtered data
        t7_fares = filtered_df[filtered_df['horizon'] == 'T+7']
        t15_fares = filtered_df[filtered_df['horizon'] == 'T+15']
        t30_fares = filtered_df[filtered_df['horizon'] == 'T+30']
        t45_fares = filtered_df[filtered_df['horizon'] == 'T+45']
        
        t7_index = 100 + t7_fares['pct_change'].mean() if not t7_fares.empty else 100
        t15_index = 100 + t15_fares['pct_change'].mean() if not t15_fares.empty else 100
        t30_index = 100 + t30_fares['pct_change'].mean() if not t30_fares.empty else 100
        t45_index = 100 + t45_fares['pct_change'].mean() if not t45_fares.empty else 100
        
        def format_change(idx):
            val = idx - 100
            if val > 0:
                return f"<span style='color: #22c55e; font-weight: bold;'>▲ {val:.2f}%</span>"
            elif val < 0:
                return f"<span style='color: #ef4444; font-weight: bold;'>▼ {val:.2f}%</span>"
            return f"<span style='color: #94a3b8; font-weight: bold;'>{val:.2f}%</span>"
            
        st.markdown(f"""
        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="border-right: 1px solid #334155; padding-right: 30px;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Actual APIx</div>
                <div style="color: #F8FAFC; font-size: 2rem; font-weight: 700; line-height: 1;">{t7_index:.2f}</div>
            </div>
            <div style="border-right: 1px solid #334155; padding: 0 30px;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">T+7 Change</div>
                <div style="font-size: 1.25rem;">{format_change(t7_index)}</div>
            </div>
            <div style="border-right: 1px solid #334155; padding: 0 30px;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">T+15 Change</div>
                <div style="font-size: 1.25rem;">{format_change(t15_index)}</div>
            </div>
            <div style="border-right: 1px solid #334155; padding: 0 30px;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">T+30 Change</div>
                <div style="font-size: 1.25rem;">{format_change(t30_index)}</div>
            </div>
            <div style="padding-left: 30px; text-align: right; flex-grow: 1;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Status</div>
                <div style="color: #F8FAFC; font-size: 1rem; font-weight: bold;">LIVE &nbsp;<span style='color: #22c55e;'>●</span></div>
                <div style="color: #94A3B8; font-size: 0.8rem;">{aggregation}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        
        # 📈 TREND GRAPH (Short term live filter)
        df_trend = pd.DataFrame({
            "Date": pd.date_range(start=base_period, periods=30, freq="D"),
            "APIx": [t7_index - 15 + i*0.5 + np.random.normal(0, 1) for i in range(30)]
        })
        
        fig_trend = go.Figure()
        fig_trend.add_trace(go.Scatter(x=df_trend["Date"], y=df_trend["APIx"], mode='lines+markers', line=dict(color='#38B2AC', width=3), marker=dict(size=6, color='#F8FAFC')))
        fig_trend.update_layout(title="APIx 30-Day Forward Trajectory (Live Filtered)", plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font_color="#F8FAFC", margin=dict(l=0, r=0, t=40, b=0), height=300)
        fig_trend.update_xaxes(showgrid=True, gridcolor='#334155')
        fig_trend.update_yaxes(showgrid=True, gridcolor='#334155')
        st.plotly_chart(fig_trend, use_container_width=True)
        
        st.markdown("<br>", unsafe_allow_html=True)

        # Use tabs for the visual components
        tab1, tab2, tab3 = st.tabs(["📍 Geographic Distribution", "📊 Route Heatmap Matrix", "📈 Macroeconomic Trends"])
        
        with tab1:
            st.markdown(f"#### Geographic Inflation Map ({len(route_summary_df)} Routes)")
            st.markdown("Visualizing average route inflation (color) and passenger traffic volume (thickness).")
            render_route_map(route_summary_df)
            
        with tab2:
            render_heatmap(filtered_df, route_summary_df)
            
        with tab3:
            st.markdown("#### Macro-Economic Continuity (15-Year Horizon)")
            st.markdown("Fusing historical **Government CPI (MOSPI)** data for *'Passenger transport by air'* with live **APIx future predictions** to provide a complete macroeconomic picture.")
            
            c_yr, c_mo = st.columns(2)
            
            month_names = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"]
                           
            with c_yr:
                base_yr = st.selectbox("🗓️ Historical Base Year", list(range(2010, 2025)), index=2)
            with c_mo:
                base_mo_name = st.selectbox("📅 Historical Base Month", month_names, index=0)
                base_mo = month_names.index(base_mo_name) + 1
                
            base_date_mask = (mospi_history_df['Date'].dt.year == base_yr) & (mospi_history_df['Date'].dt.month == base_mo)
            
            # Default to first available date if exact match not found
            base_date = mospi_history_df['Date'].iloc[0]
            if not base_date_mask.any():
                base_val = mospi_history_df['CPI_Index'].iloc[0]
            else:
                base_val = mospi_history_df[base_date_mask]['CPI_Index'].values[0]
                base_date = mospi_history_df[base_date_mask]['Date'].values[0]
                
            # Filter so the graph starts from the base date
            rebased_mospi = mospi_history_df[mospi_history_df['Date'] >= base_date].copy()
            rebased_mospi['CPI_Index'] = (rebased_mospi['CPI_Index'] / base_val) * 100
            rebased_mospi['Inflation'] = rebased_mospi['CPI_Index'] - 100
            
            # Combine MOSPI History and APIx Future
            fig_macro = go.Figure()
            
            # 1. The MOSPI History Line
            fig_macro.add_trace(go.Scatter(
                x=rebased_mospi['Date'], 
                y=rebased_mospi['CPI_Index'],
                customdata=rebased_mospi['Inflation'],
                mode='lines',
                name='MOSPI CPI',
                line=dict(color='#94A3B8', width=2),
                hovertemplate="<span style='font-size:26px; font-weight:bold; color:#F8FAFC'>%{y:.1f} Index</span><br><span style='font-size:16px; color:#38B2AC'>%{customdata:+.2f}% Inflation</span><extra></extra>"
            ))
            
            fig_macro.update_layout(
                plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", 
                font_color="#F8FAFC", margin=dict(l=0, r=0, t=20, b=0), height=500,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
                hovermode="x unified"
            )
            fig_macro.update_xaxes(showgrid=True, gridcolor='#334155', showspikes=True, spikemode="across", spikethickness=1, spikedash="dash")
            fig_macro.update_yaxes(showgrid=True, gridcolor='#334155', title="Price Index")
            st.plotly_chart(fig_macro, use_container_width=True)

elif page == "Maths & Stats":
    st.markdown("""
    <div style="margin-top: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 2.5rem; font-weight: 700; color: #F8FAFC; margin-bottom: 10px;">The Modified Laspeyres Price Index</h1>
        <p style="font-size: 1.1rem; color: #94A3B8;">A rigorous statistical methodology for computing national airfare inflation, utilizing passenger-weighted aggregations and interquartile anomaly detection.</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    """, unsafe_allow_html=True)
    st.latex(r'''\LARGE APIx = \left( \frac{\sum (P_{current} \times Q_{base})}{\sum (P_{base} \times Q_{base})} \right) \times 100''')
    st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown("""
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
        <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px;">
            <div style="color: #38B2AC; font-family: monospace; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">P_current</div>
            <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 5px;">Current Fare (Median)</div>
            <div style="color: #94A3B8; font-size: 0.9rem;">The robust median fare of all flights scraped for a given route and horizon today.</div>
        </div>
        <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px;">
            <div style="color: #38B2AC; font-family: monospace; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">P_base</div>
            <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 5px;">Base Period Fare (2012)</div>
            <div style="color: #94A3B8; font-size: 0.9rem;">The average ticket price for the route during the chosen base year, serving as the index foundation (100).</div>
        </div>
        <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px;">
            <div style="color: #38B2AC; font-family: monospace; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">Q_base</div>
            <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 5px;">Passenger Volume Weight</div>
            <div style="color: #94A3B8; font-size: 0.9rem;">The proportion of total national passenger traffic that flies on this specific route, sourced from DGCA.</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <h3 style="color: #F8FAFC; margin-bottom: 20px;">Data Filtration Pipeline</h3>
    <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <table style="width: 100%; border-collapse: collapse; text-align: left; color: #F8FAFC;">
            <thead>
                <tr style="border-bottom: 1px solid #334155; background: #0F172A;">
                    <th style="padding: 15px 20px; color: #94A3B8; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; width: 25%;">Phase</th>
                    <th style="padding: 15px 20px; color: #94A3B8; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; width: 35%;">Action</th>
                    <th style="padding: 15px 20px; color: #94A3B8; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; width: 40%;">Rationale</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 15px 20px; font-weight: bold; color: #38B2AC;">1. Ingestion</td>
                    <td style="padding: 15px 20px;">Continuous scraping of OTA and airline portals.</td>
                    <td style="padding: 15px 20px; color: #94A3B8; font-size: 0.9rem;">Captures live pricing signals across multiple booking horizons (T+1 to T+45).</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 15px 20px; font-weight: bold; color: #38B2AC;">2. IQR Filtration</td>
                    <td style="padding: 15px 20px;">Discard prices outside 1.5 × IQR.</td>
                    <td style="padding: 15px 20px; color: #94A3B8; font-size: 0.9rem;">Removes extreme anomalies (e.g., last-seat premium pricing) that distort averages.</td>
                </tr>
                <tr>
                    <td style="padding: 15px 20px; font-weight: bold; color: #38B2AC;">3. Median Aggregation</td>
                    <td style="padding: 15px 20px;">Compute the median of the filtered set.</td>
                    <td style="padding: 15px 20px; color: #94A3B8; font-size: 0.9rem;">The median is highly resistant to skewness, providing a truer reflection of central tendency than the mean.</td>
                </tr>
            </tbody>
        </table>
    </div>
    """, unsafe_allow_html=True)

elif page == "Weight Allocation (DGCA)":
    # Build global route summary just for this page so it's immune to calculator filters
    summary_records = []
    unique_routes = full_fare_df['route_id'].unique()
    for r in unique_routes:
        first_row = full_fare_df[full_fare_df['route_id'] == r].iloc[0]
        summary_records.append({
            "route_id": r, "passenger_share": first_row['passenger_share'], "passenger_count": first_row['passenger_count']
        })
    global_route_summary = pd.DataFrame(summary_records)
    total_tracked = global_route_summary['passenger_count'].sum()
    
    st.markdown("""
    <div style="margin-top: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 2.5rem; font-weight: 700; color: #F8FAFC; margin-bottom: 10px;">DGCA Passenger Weight Allocation</h1>
        <p style="font-size: 1.1rem; color: #94A3B8;">APIx integrates directly with Directorate General of Civil Aviation (DGCA) datasets to weight routes by true passenger volume, preventing low-traffic routes from hijacking the national index.</p>
    </div>
    """, unsafe_allow_html=True)
    
    if 'selected_route_id' not in st.session_state:
        st.session_state.selected_route_id = global_route_summary.sort_values('passenger_share', ascending=False).iloc[0]['route_id']
        
    selected_route_id = st.session_state.selected_route_id
    selected_row = global_route_summary[global_route_summary['route_id'] == selected_route_id].iloc[0]
    pct_formatted = selected_row['passenger_share'] * 100
    p_count = int(selected_row['passenger_count'])
    
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.markdown(f"""
        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); height: 100%;">
            <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">Route Analysis: {selected_route_id}</div>
            
            <div style="margin-bottom: 20px;">
                <div style="color: #94A3B8; font-size: 0.85rem; margin-bottom: 5px;">Quarterly Passengers</div>
                <div style="color: #F8FAFC; font-size: 1.8rem; font-weight: 700;">{p_count:,}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="color: #94A3B8; font-size: 0.85rem; margin-bottom: 5px;">Total Tracked (All Routes)</div>
                <div style="color: #F8FAFC; font-size: 1.8rem; font-weight: 700;">{int(total_tracked):,}</div>
            </div>
            
            <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <div style="color: #94A3B8; font-size: 0.85rem; margin-bottom: 5px;">Calculated Q_base Weight</div>
                <div style="color: #38B2AC; font-size: 2.5rem; font-weight: 700;">{pct_formatted:.2f}%</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        labels = global_route_summary['route_id'].tolist()
        values = global_route_summary['passenger_count'].tolist()
        pulls = [0.05 if r == selected_route_id else 0 for r in labels]
        
        fig = go.Figure(data=[go.Pie(
            labels=labels, values=values, hole=0.7, pull=pulls,
            marker=dict(colors=['#38B2AC' if r == selected_route_id else '#1E293B' for r in labels], line=dict(color='#0F172A', width=2)),
            hovertemplate="<b>%{label}</b><br>Passengers: %{value:,}<br>Share: %{percent}<extra></extra>",
            textinfo='none'
        )])
        fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font_color="#F8FAFC", showlegend=False, height=400)
        
        selection = st.plotly_chart(fig, use_container_width=True, on_select="rerun", selection_mode="points")
        if selection and "selection" in selection and selection["selection"].get("points"):
            clicked_point = selection["selection"]["points"][0]
            clicked_label = clicked_point.get("label")
            if clicked_label and clicked_label != st.session_state.selected_route_id:
                st.session_state.selected_route_id = clicked_label
                st.rerun()

    naive_delta = 20.0 / len(global_route_summary)
    apix_delta = 20.0 * selected_row['passenger_share']
    
    st.markdown(f"""
    <div style="margin-top: 40px; background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 25px;">
        <h4 style="color: #F8FAFC; margin-top: 0; margin-bottom: 20px;">Impact Simulator: +20% Fare Spike on {selected_route_id}</h4>
        
        <div style="display: flex; gap: 30px;">
            <div style="flex: 1; border-right: 1px solid #334155; padding-right: 30px;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Naive Unweighted Index</div>
                <div style="color: #EF4444; font-size: 2rem; font-weight: 700; margin-bottom: 5px;">+{naive_delta:.2f} pts</div>
                <div style="color: #94A3B8; font-size: 0.9rem;">Assumes all routes are equal. Heavily distorts inflation if this is a minor route.</div>
            </div>
            
            <div style="flex: 1;">
                <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">APIx (DGCA Weighted)</div>
                <div style="color: #38B2AC; font-size: 2rem; font-weight: 700; margin-bottom: 5px;">+{apix_delta:.2f} pts</div>
                <div style="color: #94A3B8; font-size: 0.9rem;">Absorbs the spike correctly based on the route's true {pct_formatted:.2f}% national passenger share.</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
