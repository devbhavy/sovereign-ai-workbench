import os

from app.db.database import SessionLocal
from app.db.models import Conversation, File, Message
from app.services.agent_service import run_agent


PDF_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "storage",
        "uploads",
        "example.pdf",
    )
)


db = SessionLocal()

try:
    # ---------------------------------------------------------
    # 1. Make sure PDF exists
    # ---------------------------------------------------------

    if not os.path.exists(PDF_PATH):
        raise FileNotFoundError(
            f"PDF not found at: {PDF_PATH}"
        )

    print("PDF:", PDF_PATH)

    # ---------------------------------------------------------
    # 2. Create conversation
    # ---------------------------------------------------------

    conversation = Conversation(
        title="PDF Agent Test"
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    # ---------------------------------------------------------
    # 3. Create File database record
    # ---------------------------------------------------------

    file_record = File(
        original_filename="example.pdf",
        stored_filename="example.pdf",
        mime_type="application/pdf",
        storage_path=PDF_PATH,
        size=os.path.getsize(PDF_PATH),
    )

    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    print("File ID:", file_record.id)

    # ---------------------------------------------------------
    # 4. Create the user's message
    # ---------------------------------------------------------

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content="Summarize this PDF.",
        files=[file_record],
    )

    db.add(user_message)
    db.commit()

    # ---------------------------------------------------------
    # 5. Run the agent
    # ---------------------------------------------------------

    result = run_agent(
        db=db,
        conversation_id=conversation.id,
        user_message="Create a word document with the summary of attached document",
        file_ids=[file_record.id],
    )

    # ---------------------------------------------------------
    # 6. Print result
    # ---------------------------------------------------------

    print("\n==============================")
    print("FINAL RESULT")
    print("==============================")
    print(result["response"])

    print("\nRun ID:")
    print(result["run_id"])

finally:
    db.close()