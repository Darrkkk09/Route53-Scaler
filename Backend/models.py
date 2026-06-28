from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    comment = Column(String, nullable=True)
    private_zone = Column(Boolean, default=False, nullable=False)

    # Scoped records with cascading delete
    records = relationship(
        "DNSRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(
        Integer,
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String, index=True, nullable=False)
    type = Column(String, index=True, nullable=False)
    ttl = Column(Integer, default=300, nullable=False)
    value = Column(String, nullable=False)

    # Reference back to the parent hosted zone
    zone = relationship("HostedZone", back_populates="records")
