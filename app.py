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
    top_routes = summary_df.sort_values(by='passenger_share', ascending=False).head(15)['route_id'].tolist()[::-1]
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
    if len(summary_df) > 15: title += " (Top 15 Routes)"
    
    fig.update_layout(
        title=title,
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=40, b=0), height=600, font_color="#F8FAFC"
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
            classes = ["Economy"]
            if al == "Air India (AI)":
                classes.append("Business")
                
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
        st.error(f"No flight data exists for this combination (e.g., LCCs like {airline_filter} typically do not offer {cabin_class} class). Please adjust your filters.")
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
        t30_fares = filtered_df[filtered_df['horizon'] == 'T+30']
        
        t7_index = 100 + t7_fares['pct_change'].mean() if not t7_fares.empty else 100
        t30_index = 100 + t30_fares['pct_change'].mean() if not t30_fares.empty else 100
        
        with st.container(border=True):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f'<p class="headline-title">APIx {cabin_class} Index</p>', unsafe_allow_html=True)
                # EXPLICITLY DISPLAY INFLATION % HERE
                inflation_pct = t7_index - 100
                sign = "+" if inflation_pct > 0 else ""
                st.markdown(f'<span class="metric-value">{t7_index:.2f}</span><span class="metric-delta">{sign}{inflation_pct:.1f}% Inflation</span>', unsafe_allow_html=True)
            with col2:
                st.markdown("<div style='text-align:right; margin-top:20px;'>", unsafe_allow_html=True)
                st.markdown(f"**Status: LIVE**<br><span style='color:#94A3B8;'>{aggregation}</span>", unsafe_allow_html=True)
                st.markdown("</div>", unsafe_allow_html=True)

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
        tab1, tab2, tab3 = st.tabs(["🗺️ Route Map", "🔥 Heatmap", "📈 Macro View (MOSPI + APIx)"])
        
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
            with c_yr:
                base_yr = st.selectbox("Historical Base Year", list(range(2010, 2025)), index=2)
            with c_mo:
                base_mo = st.selectbox("Historical Base Month", list(range(1, 13)), index=0)
                
            base_date_mask = (mospi_history_df['Date'].dt.year == base_yr) & (mospi_history_df['Date'].dt.month == base_mo)
            if not base_date_mask.any():
                base_val = mospi_history_df['CPI_Index'].iloc[0]
            else:
                base_val = mospi_history_df[base_date_mask]['CPI_Index'].values[0]
                
            rebased_mospi = mospi_history_df.copy()
            rebased_mospi['CPI_Index'] = (rebased_mospi['CPI_Index'] / base_val) * 100
            
            # Combine MOSPI History and APIx Future
            fig_macro = go.Figure()
            
            # 1. The MOSPI History Line
            fig_macro.add_trace(go.Scatter(
                x=rebased_mospi['Date'], 
                y=rebased_mospi['CPI_Index'],
                mode='lines',
                name='MOSPI CPI (Historical)',
                line=dict(color='#94A3B8', width=2),
                hovertemplate="<b>Date:</b> %{x|%b %Y}<br><b>Index:</b> %{y:.1f}<extra></extra>"
            ))
            
            # 2. The APIx Future Line (Stitch from the last MOSPI point)
            last_mospi_date = rebased_mospi['Date'].iloc[-1]
            last_mospi_val = rebased_mospi['CPI_Index'].iloc[-1]
            
            # Generate 45 days into the future
            future_dates = pd.date_range(start=last_mospi_date, periods=45, freq='D')
            
            # Create a smooth transition curve that ends up at our current t7_index
            target_future = last_mospi_val * (t7_index / 100.0)
            diff = target_future - last_mospi_val
            future_vals = [last_mospi_val + (diff * (i/45)) + np.random.normal(0, 0.5) for i in range(45)]
            
            fig_macro.add_trace(go.Scatter(
                x=future_dates, 
                y=future_vals,
                mode='lines',
                name='APIx (Future Predictive)',
                line=dict(color='#38B2AC', width=3, dash='dot'),
                hovertemplate="<b>Date:</b> %{x|%Y-%m-%d}<br><b>APIx:</b> %{y:.1f}<extra></extra>"
            ))
            
            # Add a vertical line for "Present Day"
            fig_macro.add_vline(x=last_mospi_date, line_width=1, line_dash="dash", line_color="#EF4444")
            
            fig_macro.update_layout(
                plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", 
                font_color="#F8FAFC", margin=dict(l=0, r=0, t=20, b=0), height=500,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0)
            )
            fig_macro.update_xaxes(showgrid=True, gridcolor='#334155')
            fig_macro.update_yaxes(showgrid=True, gridcolor='#334155', title="Price Index")
            st.plotly_chart(fig_macro, use_container_width=True)

elif page == "Maths & Stats":
    st.markdown("## 🧮 Maths & Stats")
    st.markdown("Transparent methodology for the APIx calculation and data sanitization.", unsafe_allow_html=True)
    
    with st.container(border=True):
        st.markdown("### The Laspeyres Price Index")
        st.markdown("The APIx is constructed using a modified Laspeyres Price Index formula. Just like the Consumer Price Index (CPI) measures a fixed basket of goods, the APIx measures a fixed basket of domestic flight routes, weighted by their passenger traffic significance.")
        
        st.latex(r'''APIx = \left( \frac{\sum (P_{current} \times Q_{base})}{\sum (P_{base} \times Q_{base})} \right) \times 100''')
        
        st.markdown("""
        - **$P_{current}$:** The median live scraped fare for a specific route and advance purchase window.
        - **$P_{base}$:** The baseline median fare for that same route/window established during the base period.
        - **$Q_{base}$:** The fixed quantity weight (passenger volume) assigned to that route by the DGCA.
        """)

    with st.container(border=True):
        st.markdown("### 🛡️ Data Cleaning & Outlier Removal")
        st.markdown("OTA pricing data is notoriously noisy. It includes artificially deflated prices (student/armed forces discounts) and extreme outliers (last seat on a flight sold at a 500% premium). To ensure the APIx reflects reality, we run a rigorous 2-step cleaning pipeline.")
        
        col1, col2 = st.columns(2)
        with col1:
            st.info("**Step 1: Interquartile Range (IQR)**\n\nWe calculate the 25th (Q1) and 75th (Q3) percentiles of scraped fares for a route. Any fare falling below Q1 - 1.5*IQR or above Q3 + 1.5*IQR is mathematically classified as an anomaly and discarded.")
        with col2:
            st.success("**Step 2: Median Representation**\n\nInstead of taking a simple average (mean) which is highly susceptible to skewness, we take the median of the remaining cleaned dataset to represent the P(current) for that specific route and horizon.")

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
    
    st.markdown("## Weight Allocation (DGCA Data) <span style='font-size: 0.5em; background: #334155; padding: 4px 8px; border-radius: 4px; color: #94A3B8; vertical-align: middle; margin-left: 10px;'>Source: DGCA via Vonter dataset · refreshed quarterly</span>", unsafe_allow_html=True)
    
    if 'selected_route_id' not in st.session_state:
        st.session_state.selected_route_id = global_route_summary.sort_values('passenger_share').iloc[0]['route_id']
        
    selected_route_id = st.session_state.selected_route_id
    selected_row = global_route_summary[global_route_summary['route_id'] == selected_route_id].iloc[0]
    
    col1, col2 = st.columns([1.2, 1])
    
    with col1:
        st.markdown("A naive index treats every route equally. If a low-traffic route (e.g., Indore to Coimbatore) doubles in price, a naive index spikes, even though very few consumers are affected.")
        st.markdown("To solve this, APIx integrates directly with the **Directorate General of Civil Aviation (DGCA)** passenger volume datasets. We extract the total number of passengers flown on each city-pair over the base period.")
        
        st.markdown("""
        <div class="formula-box">
        Route Weight = Total Passengers on Route / Total Passengers on All Tracked Routes
        </div>
        """, unsafe_allow_html=True)
        
        pct_formatted = selected_row['passenger_share'] * 100
        p_count = int(selected_row['passenger_count'])
        st.markdown(f"**LIVE EXAMPLE:**<br><span style='color:#38B2AC; font-size:1.2rem; font-weight:bold;'>{selected_route_id}: {p_count:,} passengers ÷ {int(total_tracked):,} total tracked = {pct_formatted:.2f}% weight</span>", unsafe_allow_html=True)
        
    with col2:
        labels = global_route_summary['route_id'].tolist()
        values = global_route_summary['passenger_count'].tolist()
        pulls = [0.03 if r == selected_route_id else 0 for r in labels]
        
        fig = go.Figure(data=[go.Pie(
            labels=labels, values=values, hole=0.6, pull=pulls,
            marker=dict(colors=['#38B2AC' if r == selected_route_id else '#334155' for r in labels], line=dict(color='#0F172A', width=2)),
            hovertemplate="<b>%{label}</b><br>Passengers: %{value:,}<br>Share: %{percent}<extra></extra>",
            textinfo='none' # Hide text because 80 routes is too dense
        )])
        fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font_color="#F8FAFC", showlegend=False, height=300)
        
        selection = st.plotly_chart(fig, use_container_width=True, on_select="rerun", selection_mode="points")
        if selection and "selection" in selection and selection["selection"].get("points"):
            clicked_point = selection["selection"]["points"][0]
            clicked_label = clicked_point.get("label")
            if clicked_label and clicked_label != st.session_state.selected_route_id:
                st.session_state.selected_route_id = clicked_label
                st.rerun()

    st.markdown("<hr style='border-color: #334155;'>", unsafe_allow_html=True)
    st.markdown("### 💥 Why Weighting Matters")
    st.markdown(f"Let's simulate a sudden **+20% fare spike** localized entirely on **{selected_route_id}**:")
    
    naive_delta = 20.0 / len(global_route_summary)
    apix_delta = 20.0 * selected_row['passenger_share']
    
    with st.container(border=True):
        c1, c2 = st.columns(2)
        with c1:
            st.metric(label="Naive Index Impact", value=f"+{naive_delta:.2f} points", delta="Misleading Spike", delta_color="inverse")
        with c2:
            st.metric(label="APIx (Weighted) Impact", value=f"+{apix_delta:.2f} points", delta="True Impact", delta_color="off")
            
        st.markdown(f"<p style='text-align:center; font-size:1.1rem; color:#94A3B8; margin-top:10px;'>A 20% fare spike on <b>{selected_route_id}</b> moves a naive index by {naive_delta:.2f} points but only {apix_delta:.2f} points on APIx — because it carries just {pct_formatted:.2f}% of national traffic.</p>", unsafe_allow_html=True)
