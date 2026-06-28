from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Standard DNS Record Types
class RecordType(str, Enum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    MX = "MX"
    TXT = "TXT"
    SRV = "SRV"
    NS = "NS"
    SOA = "SOA"

# Hosted Zone Schemas
class HostedZoneCreate(BaseModel):
    name: str = Field(..., description="The domain name of the hosted zone. Must end with a trailing dot '.'")
    comment: Optional[str] = Field(None, description="An optional description of the hosted zone.")
    private_zone: bool = Field(False, description="Indicates whether the hosted zone is a private hosted zone.")

    @field_validator("name")
    @classmethod
    def validate_zone_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith("."):
            raise ValueError("Hosted zone name must end with a trailing dot '.' (e.g., 'example.com.')")
        if len(v) < 2:
            raise ValueError("Hosted zone name must be a valid domain name.")
        return v

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = Field(None, description="An optional description of the hosted zone.")
    private_zone: Optional[bool] = Field(None, description="Indicates whether the hosted zone is a private hosted zone.")

class HostedZoneResponse(BaseModel):
    id: int
    name: str
    comment: Optional[str]
    private_zone: bool

    model_config = ConfigDict(from_attributes=True)


# DNS Record Schemas
class DNSRecordCreate(BaseModel):
    name: str = Field(..., description="The name of the DNS record. Must end with a trailing dot '.'")
    type: RecordType = Field(..., description="The DNS record type.")
    ttl: int = Field(300, ge=0, description="The resource record cache time to live (TTL), in seconds.")
    value: str = Field(..., description="The resource record value (e.g. IP address, alias target, TXT string).")

    @field_validator("name")
    @classmethod
    def validate_record_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith("."):
            raise ValueError("DNS record name must end with a trailing dot '.' (e.g., 'www.example.com.')")
        return v

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(None, description="The name of the DNS record. Must end with a trailing dot '.'")
    type: Optional[RecordType] = Field(None, description="The DNS record type.")
    ttl: Optional[int] = Field(None, ge=0, description="The resource record cache time to live (TTL), in seconds.")
    value: Optional[str] = Field(None, description="The resource record value.")

    @field_validator("name")
    @classmethod
    def validate_record_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if not v.endswith("."):
                raise ValueError("DNS record name must end with a trailing dot '.' (e.g., 'www.example.com.')")
        return v

class DNSRecordResponse(BaseModel):
    id: int
    zone_id: int
    name: str
    type: RecordType
    ttl: int
    value: str

    model_config = ConfigDict(from_attributes=True)
