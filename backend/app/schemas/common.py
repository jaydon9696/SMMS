from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ApiResponse[DataT](BaseModel):
    data: DataT


class MessageResponse(BaseModel):
    message: str


class AuditFields(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
