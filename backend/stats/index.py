import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для получения статистики и аналитики по сделкам
    Args: event - HTTP запрос GET
          context - контекст выполнения функции
    Returns: JSON с метриками и данными для графиков
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                COUNT(*) as total_deals,
                COALESCE(SUM(amount), 0) as total_revenue,
                COALESCE(SUM(profit), 0) as total_profit,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_deals
            FROM deals
        ''')
        
        stats = cursor.fetchone()
        
        cursor.execute('''
            SELECT 
                TO_CHAR(deal_date, 'Mon') as month,
                SUM(amount) as revenue
            FROM deals
            WHERE deal_date >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY TO_CHAR(deal_date, 'Mon'), EXTRACT(MONTH FROM deal_date)
            ORDER BY EXTRACT(MONTH FROM deal_date)
        ''')
        
        sales_data = []
        for row in cursor.fetchall():
            sales_data.append({
                'month': row[0],
                'value': float(row[1]) if row[1] else 0
            })
        
        cursor.execute('''
            SELECT 
                TO_CHAR(deal_date, 'Mon') as month,
                CASE 
                    WHEN SUM(amount) > 0 THEN (SUM(profit) / SUM(amount) * 100)
                    ELSE 0 
                END as margin
            FROM deals
            WHERE deal_date >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY TO_CHAR(deal_date, 'Mon'), EXTRACT(MONTH FROM deal_date)
            ORDER BY EXTRACT(MONTH FROM deal_date)
        ''')
        
        profit_data = []
        for row in cursor.fetchall():
            profit_data.append({
                'month': row[0],
                'value': round(float(row[1]), 1) if row[1] else 0
            })
        
        total_revenue = float(stats[1])
        total_profit = float(stats[2])
        profit_margin = round((total_profit / total_revenue * 100), 1) if total_revenue > 0 else 0
        
        result = {
            'totalRevenue': total_revenue,
            'totalProfit': total_profit,
            'profitMargin': profit_margin,
            'activeDeals': stats[3],
            'totalDeals': stats[0],
            'salesData': sales_data,
            'profitData': profit_data
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
