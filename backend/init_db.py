from app.db.database import Base, engine
from app.db.models import Conversation


Base.metadata.create_all(bind=engine)

print("Database initialized successfully.")