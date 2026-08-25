from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

Base = declarative_base()

class RawFare(Base):
    __tablename__ = 'raw_fares'
    id = Column(Integer, primary_key=True)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    airline = Column(String(2), nullable=False)
    flight_no = Column(String(10))
    query_date = Column(DateTime, default=datetime.datetime.utcnow)
    travel_date = Column(Date, nullable=False)
    lead_time = Column(String(10), nullable=False)  # T+1, T+7, etc.
    total_fare = Column(Float, nullable=False)
    currency = Column(String(3), default='INR')
    source = Column(String(50))

class RepresentativeFare(Base):
    __tablename__ = 'representative_fares'
    id = Column(Integer, primary_key=True)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    query_date = Column(Date, nullable=False)
    lead_time = Column(String(10), nullable=False)
    representative_fare = Column(Float, nullable=False)

class RouteWeight(Base):
    __tablename__ = 'route_weights'
    id = Column(Integer, primary_key=True)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    weight = Column(Float, nullable=False)
    effective_from = Column(Date)
    effective_to = Column(Date)

class APIxIndex(Base):
    __tablename__ = 'apix_index'
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    lead_time = Column(String(10), nullable=False)
    apix_value = Column(Float, nullable=False)

# For testing locally with SQLite
engine = create_engine('sqlite:///apix.db', echo=False)

def init_db():
    Base.metadata.create_all(engine)
    print("Database tables created.")

if __name__ == "__main__":
    init_db()
