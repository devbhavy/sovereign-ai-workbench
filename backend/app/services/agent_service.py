import os
from datetime import datetime
from uuid import UUID

from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session

from app.db.models import (
    AgentEvent,
    AgentRun,
    Artifact,
    Conversation,
    File,
    Message,
)

from app.agent.graph import graph


def _serialize_message_content(content):
    """
    Convert LangChain message content into something JSONB can store.
    """

    if isinstance(content, str):
        return {
            "content": content
        }

    return {
        "content": content
    }


def _extract_tool_calls(message):
    """
    Extract tool calls from an AI message.
    """

    tool_calls = getattr(message, "tool_calls", None)

    if not tool_calls:
        return []

    return tool_calls


def _extract_artifact_paths(text: str) -> list[str]:
    """
    Look for generated document paths returned by document_generator.

    Example:
        Document successfully created at:
        D:\\...\\storage\\outputs\\report.docx
    """

    if not text:
        return []

    paths = []

    marker = "Document successfully created at:"

    if marker in text:
        path = text.split(marker, 1)[1].strip()

        if os.path.exists(path):
            paths.append(path)

    return paths


def _save_artifacts(
    db: Session,
    conversation_id: UUID,
    paths: list[str],
):
    """
    Create Artifact DB records for generated files.
    """

    artifacts = []

    for path in paths:

        if not os.path.exists(path):
            continue

        filename = os.path.basename(path)

        extension = os.path.splitext(filename)[1].lower()

        file_type = extension.lstrip(".") or None

        artifact = Artifact(
            conversation_id=conversation_id,
            filename=filename,
            file_type=file_type,
            storage_path=os.path.abspath(path),
        )

        db.add(artifact)
        artifacts.append(artifact)

    if artifacts:
        db.flush()

    return artifacts


def _record_agent_events(
    db: Session,
    run_id: UUID,
    messages: list,
):
    """
    Convert observable LangGraph messages into AgentEvents.

    We intentionally store tool calls/results and not private
    chain-of-thought.
    """

    sequence = 1
    events = []

    for message in messages:

        message_type = getattr(message, "type", None)

        # -----------------------------------------------------
        # AI message
        # -----------------------------------------------------

        if message_type == "ai":

            tool_calls = _extract_tool_calls(message)

            if tool_calls:

                for tool_call in tool_calls:

                    event = AgentEvent(
                        run_id=run_id,
                        sequence=sequence,
                        event_type="tool_call",
                        tool_name=tool_call.get("name"),
                        input={
                            "args": tool_call.get("args", {})
                        },
                        output=None,
                    )

                    db.add(event)
                    events.append(event)

                    sequence += 1

        # -----------------------------------------------------
        # Tool result
        # -----------------------------------------------------

        elif message_type == "tool":

            tool_name = getattr(message, "name", None)

            content = getattr(message, "content", None)

            event = AgentEvent(
                run_id=run_id,
                sequence=sequence,
                event_type="tool_result",
                tool_name=tool_name,
                input=None,
                output=_serialize_message_content(content),
            )

            db.add(event)
            events.append(event)

            sequence += 1

    db.flush()

    return events


def run_agent(
    db: Session,
    conversation_id: UUID,
    user_message: str,
    file_ids: list[UUID] | None = None,
):
    """
    Execute the LangGraph agent for one user request.

    Responsibilities:

    - Create AgentRun
    - Load attached files
    - Invoke LangGraph
    - Record observable agent events
    - Save assistant message
    - Save generated artifacts
    - Update AgentRun
    """

    file_ids = file_ids or []

    # =========================================================
    # 1. Verify conversation
    # =========================================================

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found")

    # =========================================================
    # 2. Load attached files
    # =========================================================

    files = []

    if file_ids:

        files = (
            db.query(File)
            .filter(File.id.in_(file_ids))
            .all()
        )

        if len(files) != len(file_ids):
            raise ValueError(
                "One or more files were not found"
            )

    # Convert DB paths into absolute paths
    file_paths = [
        os.path.abspath(file.storage_path)
        for file in files
    ]

    # =========================================================
    # 3. Create AgentRun
    # =========================================================

    run = AgentRun(
        conversation_id=conversation_id,
        input={
            "message": user_message,
            "file_ids": [
                str(file_id)
                for file_id in file_ids
            ],
        },
        status="running",
    )

    db.add(run)
    db.commit()
    db.refresh(run)

    try:

        # =====================================================
        # 4. Record model start
        # =====================================================

        start_event = AgentEvent(
            run_id=run.id,
            sequence=1,
            event_type="model_start",
            tool_name=None,
            input={
                "message": user_message,
                "file_count": len(file_paths),
            },
            output=None,
        )

        db.add(start_event)
        db.commit()

        # =====================================================
        # 5. Invoke LangGraph
        # =====================================================

        result = graph.invoke(
            {
                "messages": [
                    HumanMessage(content=user_message)
                ],
                "files": file_paths,
                "tool_rounds": 0,
            }
        )

        print("\n===== DEBUG MESSAGES =====")

        for i, message in enumerate(result.get("messages", [])):
            print(f"\nMESSAGE {i}")
            print("TYPE:", type(message))
            print("MESSAGE TYPE:", getattr(message, "type", None))
            print("NAME:", getattr(message, "name", None))
            print("TOOL CALLS:", getattr(message, "tool_calls", None))
            print("CONTENT:", getattr(message, "content", None))

        # =====================================================
        # 6. Extract messages
        # =====================================================

        messages = result.get("messages", [])

        if not messages:
            raise RuntimeError(
                "Agent returned no messages"
            )

        # =====================================================
        # 7. Record tool events
        # =====================================================

        _record_agent_events(
            db=db,
            run_id=run.id,
            messages=messages,
        )

        # =====================================================
        # 8. Extract final response
        # =====================================================

        final_message = messages[-1]

        final_response = final_message.content

        if not isinstance(final_response, str):
            final_response = str(final_response)

        if not final_response.strip():
            final_response = (
                "I wasn't able to generate a response."
            )

        # =====================================================
        # 9. Save assistant message
        # =====================================================

        assistant_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=final_response,
        )

        db.add(assistant_message)

        # =====================================================
        # 10. Find generated artifacts
        # =====================================================

        artifact_paths = _extract_artifact_paths(
            final_response
        )

        artifacts = _save_artifacts(
            db=db,
            conversation_id=conversation_id,
            paths=artifact_paths,
        )

        # =====================================================
        # 11. Record final event
        # =====================================================

        max_sequence = (
            db.query(AgentEvent.sequence)
            .filter(AgentEvent.run_id == run.id)
            .order_by(AgentEvent.sequence.desc())
            .first()
        )

        next_sequence = (
            max_sequence[0] + 1
            if max_sequence
            else 1
        )

        final_event = AgentEvent(
            run_id=run.id,
            sequence=next_sequence,
            event_type="final",
            tool_name=None,
            input=None,
            output={
                "response": final_response,
                "artifact_ids": [
                    str(artifact.id)
                    for artifact in artifacts
                ],
            },
        )

        db.add(final_event)

        # =====================================================
        # 12. Update AgentRun
        # =====================================================

        run.status = "completed"

        run.output = {
            "response": final_response,
            "artifact_ids": [
                str(artifact.id)
                for artifact in artifacts
            ],
        }

        run.completed_at = datetime.utcnow()

        conversation.updated_at = datetime.utcnow()

        db.commit()

        return {
            "run_id": run.id,
            "response": final_response,
            "artifact_ids": [
                artifact.id
                for artifact in artifacts
            ],
            "status": run.status,
        }

    except Exception as e:

        # =====================================================
        # Agent failed
        # =====================================================

        error_sequence = (
            db.query(AgentEvent.sequence)
            .filter(AgentEvent.run_id == run.id)
            .order_by(AgentEvent.sequence.desc())
            .first()
        )

        next_sequence = (
            error_sequence[0] + 1
            if error_sequence
            else 1
        )

        error_event = AgentEvent(
            run_id=run.id,
            sequence=next_sequence,
            event_type="error",
            tool_name=None,
            input=None,
            output={
                "error": str(e),
            },
        )

        db.add(error_event)

        run.status = "failed"

        run.output = {
            "error": str(e),
        }

        run.completed_at = datetime.utcnow()

        db.commit()

        raise