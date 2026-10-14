import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ["DATABASE_URL"])

with conn, conn.cursor() as cur:
    cur.execute("SELECT version();")
    print(cur.fetchone())
    cur.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    )
    print(cur.fetchall())

conn.close()
