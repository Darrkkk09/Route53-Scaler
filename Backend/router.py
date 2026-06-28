from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models
import schemas

router = APIRouter()

# Helper function to validate DNS record name format against hosted zone name
def validate_record_name_for_zone(record_name: str, zone_name: str) -> bool:
    rec = record_name.strip().lower()
    zone = zone_name.strip().lower()
    # It must either match the zone name exactly (root record) 
    # or be a subdomain of the zone (ends with .zone_name)
    if rec == zone:
        return True
    if rec.endswith("." + zone):
        return True
    return False


# ==========================================
# Hosted Zone Endpoints
# ==========================================

@router.post(
    "/zones",
    response_model=schemas.HostedZoneResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Hosted Zones"],
    summary="Create a new hosted zone"
)
def create_hosted_zone(
    zone_in: schemas.HostedZoneCreate,
    db: Session = Depends(get_db)
):
    # Enforce unique zone name
    existing_zone = db.query(models.HostedZone).filter(models.HostedZone.name == zone_in.name).first()
    if existing_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hosted zone with name '{zone_in.name}' already exists."
        )

    db_zone = models.HostedZone(
        name=zone_in.name,
        comment=zone_in.comment,
        private_zone=zone_in.private_zone
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone


@router.get(
    "/zones",
    response_model=List[schemas.HostedZoneResponse],
    tags=["Hosted Zones"],
    summary="List all hosted zones"
)
def list_hosted_zones(
    name: Optional[str] = Query(None, description="Filter zones by domain name"),
    private_zone: Optional[bool] = Query(None, description="Filter zones by privacy status"),
    db: Session = Depends(get_db)
):
    query = db.query(models.HostedZone)
    if name is not None:
        query = query.filter(models.HostedZone.name == name.strip().lower())
    if private_zone is not None:
        query = query.filter(models.HostedZone.private_zone == private_zone)
    return query.all()


@router.get(
    "/zones/{zone_id}",
    response_model=schemas.HostedZoneResponse,
    tags=["Hosted Zones"],
    summary="Get hosted zone details"
)
def get_hosted_zone(
    zone_id: int,
    db: Session = Depends(get_db)
):
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )
    return db_zone


@router.put(
    "/zones/{zone_id}",
    response_model=schemas.HostedZoneResponse,
    tags=["Hosted Zones"],
    summary="Update a hosted zone"
)
def update_hosted_zone(
    zone_id: int,
    zone_in: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db)
):
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )
    
    if zone_in.comment is not None:
        db_zone.comment = zone_in.comment
    if zone_in.private_zone is not None:
        db_zone.private_zone = zone_in.private_zone

    db.commit()
    db.refresh(db_zone)
    return db_zone


@router.delete(
    "/zones/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Hosted Zones"],
    summary="Delete a hosted zone"
)
def delete_hosted_zone(
    zone_id: int,
    db: Session = Depends(get_db)
):
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )
    db.delete(db_zone)
    db.commit()
    return None


# ==========================================
# DNS Record Endpoints (Scoped to Hosted Zone)
# ==========================================

@router.post(
    "/zones/{zone_id}/records",
    response_model=schemas.DNSRecordResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["DNS Records"],
    summary="Create a new DNS record"
)
def create_dns_record(
    zone_id: int,
    record_in: schemas.DNSRecordCreate,
    db: Session = Depends(get_db)
):
    # Verify zone exists
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )

    # Validate record name format matches zone domain
    if not validate_record_name_for_zone(record_in.name, db_zone.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Record name '{record_in.name}' must be the zone root or a subdomain of '{db_zone.name}'"
        )

    db_record = models.DNSRecord(
        zone_id=zone_id,
        name=record_in.name,
        type=record_in.type,
        ttl=record_in.ttl,
        value=record_in.value
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get(
    "/zones/{zone_id}/records",
    response_model=List[schemas.DNSRecordResponse],
    tags=["DNS Records"],
    summary="List DNS records in a hosted zone"
)
def list_dns_records(
    zone_id: int,
    name: Optional[str] = Query(None, description="Filter records by name"),
    type: Optional[schemas.RecordType] = Query(None, description="Filter records by type"),
    db: Session = Depends(get_db)
):
    # Verify zone exists
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )

    query = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id)
    if name is not None:
        query = query.filter(models.DNSRecord.name == name.strip().lower())
    if type is not None:
        query = query.filter(models.DNSRecord.type == type)
    
    return query.all()


@router.get(
    "/zones/{zone_id}/records/{record_id}",
    response_model=schemas.DNSRecordResponse,
    tags=["DNS Records"],
    summary="Get DNS record details"
)
def get_dns_record(
    zone_id: int,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Verify zone exists
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )

    db_record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id
    ).first()

    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS Record with ID {record_id} not found in hosted zone {zone_id}."
        )
    return db_record


@router.put(
    "/zones/{zone_id}/records/{record_id}",
    response_model=schemas.DNSRecordResponse,
    tags=["DNS Records"],
    summary="Update an existing DNS record"
)
def update_dns_record(
    zone_id: int,
    record_id: int,
    record_in: schemas.DNSRecordUpdate,
    db: Session = Depends(get_db)
):
    # Verify zone exists
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )

    db_record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id
    ).first()

    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS Record with ID {record_id} not found in hosted zone {zone_id}."
        )

    # Validate updated name format if name is being changed
    if record_in.name is not None:
        if not validate_record_name_for_zone(record_in.name, db_zone.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Record name '{record_in.name}' must be the zone root or a subdomain of '{db_zone.name}'"
            )
        db_record.name = record_in.name

    if record_in.type is not None:
        db_record.type = record_in.type
    if record_in.ttl is not None:
        db_record.ttl = record_in.ttl
    if record_in.value is not None:
        db_record.value = record_in.value

    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete(
    "/zones/{zone_id}/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["DNS Records"],
    summary="Delete a DNS record"
)
def delete_dns_record(
    zone_id: int,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Verify zone exists
    db_zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone with ID {zone_id} not found."
        )

    db_record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id
    ).first()

    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS Record with ID {record_id} not found in hosted zone {zone_id}."
        )

    db.delete(db_record)
    db.commit()
    return None
