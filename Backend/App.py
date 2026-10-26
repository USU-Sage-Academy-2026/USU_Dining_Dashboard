from flask import Flask, jsonify
import psycopg2
from flask_cors import CORS

# 1. YOU MUST INITIALIZE THE 'app' VARIABLE HERE FIRST!
app = Flask(__name__)
CORS(app) 

CONN_STR = (
    "host=ep-raspy-sea-b4cec4ru.c-6.us-east-2.aws.neon.tech "
    "dbname=neondb "
    "user=neondb_owner "
    "password=npg_JLQ8twbh3zma "
    "sslmode=require "
    "channel_binding=disable"
)

@app.route('/api/ticket-hours')
def get_ticket_hours():
    try:
        connection = psycopg2.connect(CONN_STR)
        cursor = connection.cursor()
        
        query = """
            SELECT 
                h."Hour" AS hour_of_day,
                ROUND(AVG(o."Avg_Bump_Time"), 1) AS avg_time
            FROM public."Mobile_Orders" o
            JOIN public."Hour" h ON o."Time_Period_Hour" = h."Hour"
            GROUP BY h."Hour"
            ORDER BY h."Hour";
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        
        labels = [f"{int(row[0])}:00" for row in rows]
        values = [float(row[1]) for row in rows]
        
        cursor.close()
        connection.close()
        
        return jsonify({
            "labels": labels,
            "values": values
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)