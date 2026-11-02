
from app.database import get_connection


def create_tables():
    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    extracted_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS people (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    name TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    description TEXT NOT NULL,
                    owner TEXT,
                    deadline TEXT,
                    status TEXT,
                    evidence TEXT,
                    source_document TEXT
                );

                CREATE TABLE IF NOT EXISTS modules (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    name TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS dependencies (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    source_task TEXT,
                    depends_on TEXT,
                    relationship TEXT,
                    original_text TEXT
                );

                CREATE TABLE IF NOT EXISTS decisions (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    description TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS verification_issues (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
                    task_description TEXT,
                    missing_fields TEXT[],
                    status TEXT
                );
                CREATE TABLE IF NOT EXISTS clarifications (
                    id SERIAL PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id),
    task_description TEXT NOT NULL,
    field_name TEXT NOT NULL,
    original_value TEXT,
    clarified_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
            """)

        print("ProjectPulse database tables created successfully!")


if __name__ == "__main__":
    create_tables()
