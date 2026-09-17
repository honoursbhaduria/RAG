import os
import json
import sqlite3
import logfire
from typing import List, Dict, Optional, Any
from datetime import datetime

# Neon Postgres or local SQLite database setup
DATABASE_URL = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL", "")

IS_POSTGRES = DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")

def get_db_connection():
    """Returns a connection to either Neon Postgres or local SQLite."""
    if IS_POSTGRES:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(DATABASE_URL)
            return conn, "postgres"
        except Exception as e:
            logfire.warning(f"Could not connect to Neon Postgres ({e}), falling back to SQLite.")
    
    # Fallback: SQLite
    os.makedirs("./data", exist_ok=True)
    conn = sqlite3.connect("./data/cognivault_sessions.db")
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"


def init_db():
    """Initializes schema in Neon Postgres or SQLite."""
    conn, engine = get_db_connection()
    try:
        cur = conn.cursor()
        if engine == "postgres":
            cur.execute("""
                CREATE TABLE IF NOT EXISTS session_documents (
                    session_id VARCHAR(128) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    file_type VARCHAR(64),
                    chunks_count INT DEFAULT 1,
                    points_indexed INT DEFAULT 1,
                    preview TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (session_id, filename)
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id VARCHAR(128) PRIMARY KEY,
                    title VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id VARCHAR(128) PRIMARY KEY,
                    session_id VARCHAR(128) NOT NULL,
                    role VARCHAR(32) NOT NULL,
                    content TEXT NOT NULL,
                    thought_process JSONB,
                    sources JSONB,
                    status VARCHAR(64),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS session_documents (
                    session_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    file_type TEXT,
                    chunks_count INTEGER DEFAULT 1,
                    points_indexed INTEGER DEFAULT 1,
                    preview TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (session_id, filename)
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id TEXT PRIMARY KEY,
                    title TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    thought_process TEXT,
                    sources TEXT,
                    status TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()
        logfire.info(f"Session database initialized using {engine}.")
    except Exception as e:
        logfire.error(f"Error initializing session database: {e}")
    finally:
        conn.close()


# Auto-init on module import
try:
    init_db()
except Exception as e:
    logfire.warning(f"Database init postponed: {e}")


def save_session_document(
    session_id: str,
    filename: str,
    chunks_count: int = 1,
    points_indexed: int = 1,
    preview: str = "",
    file_type: str = ""
) -> Dict[str, Any]:
    """Stores or updates a document attached to a specific chat session."""
    conn, engine = get_db_connection()
    doc_data = {
        "filename": filename,
        "file_type": file_type or filename.split(".")[-1].lower(),
        "chunks_count": chunks_count,
        "points_indexed": points_indexed,
        "preview": preview,
        "session_id": session_id,
        "created_at": datetime.utcnow().isoformat()
    }
    try:
        cur = conn.cursor()
        if engine == "postgres":
            cur.execute("""
                INSERT INTO session_documents (session_id, filename, file_type, chunks_count, points_indexed, preview, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (session_id, filename) DO UPDATE SET
                    chunks_count = EXCLUDED.chunks_count,
                    points_indexed = EXCLUDED.points_indexed,
                    preview = EXCLUDED.preview;
            """, (session_id, filename, doc_data["file_type"], chunks_count, points_indexed, preview))
        else:
            cur.execute("""
                INSERT INTO session_documents (session_id, filename, file_type, chunks_count, points_indexed, preview, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(session_id, filename) DO UPDATE SET
                    chunks_count = excluded.chunks_count,
                    points_indexed = excluded.points_indexed,
                    preview = excluded.preview;
            """, (session_id, filename, doc_data["file_type"], chunks_count, points_indexed, preview))
        conn.commit()
    except Exception as e:
        logfire.error(f"Failed to save document {filename} for session {session_id}: {e}")
    finally:
        conn.close()
    return doc_data


def get_session_documents(session_id: str) -> List[Dict[str, Any]]:
    """Retrieves all documents saved in a given chat session."""
    conn, engine = get_db_connection()
    docs = []
    try:
        cur = conn.cursor()
        if engine == "postgres":
            from psycopg2.extras import RealDictCursor
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT session_id, filename, file_type, chunks_count, points_indexed, preview, created_at
                FROM session_documents
                WHERE session_id = %s
                ORDER BY created_at ASC;
            """, (session_id,))
            rows = cur.fetchall()
            for r in rows:
                docs.append(dict(r))
        else:
            cur.execute("""
                SELECT session_id, filename, file_type, chunks_count, points_indexed, preview, created_at
                FROM session_documents
                WHERE session_id = ?
                ORDER BY created_at ASC;
            """, (session_id,))
            rows = cur.fetchall()
            for r in rows:
                docs.append(dict(r))
    except Exception as e:
        logfire.error(f"Failed to retrieve documents for session {session_id}: {e}")
    finally:
        conn.close()
    return docs


def delete_session_document(session_id: str, filename: str) -> bool:
    """Removes a document record from a chat session."""
    conn, engine = get_db_connection()
    try:
        cur = conn.cursor()
        if engine == "postgres":
            cur.execute("DELETE FROM session_documents WHERE session_id = %s AND filename = %s;", (session_id, filename))
        else:
            cur.execute("DELETE FROM session_documents WHERE session_id = ? AND filename = ?;", (session_id, filename))
        conn.commit()
        return True
    except Exception as e:
        logfire.error(f"Failed to delete document {filename} from session {session_id}: {e}")
        return False
    finally:
        conn.close()


def clear_session_documents(session_id: str) -> bool:
    """Removes all documents belonging to a chat session."""
    conn, engine = get_db_connection()
    try:
        cur = conn.cursor()
        if engine == "postgres":
            cur.execute("DELETE FROM session_documents WHERE session_id = %s;", (session_id,))
        else:
            cur.execute("DELETE FROM session_documents WHERE session_id = ?;", (session_id,))
        conn.commit()
        return True
    except Exception as e:
        logfire.error(f"Failed to clear documents for session {session_id}: {e}")
        return False
    finally:
        conn.close()
