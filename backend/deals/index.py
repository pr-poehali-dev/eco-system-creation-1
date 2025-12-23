import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления сделками: получение списка, создание, обновление
    Args: event - HTTP запрос с методом GET/POST/PUT
          context - контекст выполнения функции
    Returns: JSON с данными сделок или статус операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
        if method == 'GET':
            cursor.execute('''
                SELECT d.id, d.client_name, d.amount, d.profit, d.status, 
                       d.deal_date, d.created_at, u.full_name as created_by_name
                FROM deals d
                LEFT JOIN users u ON d.created_by = u.id
                ORDER BY d.deal_date DESC
            ''')
            
            deals = []
            for row in cursor.fetchall():
                deals.append({
                    'id': row[0],
                    'client': row[1],
                    'amount': float(row[2]),
                    'profit': float(row[3]),
                    'status': row[4],
                    'date': row[5].strftime('%d.%m.%Y'),
                    'created_at': row[6].isoformat(),
                    'created_by': row[7]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'deals': deals}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            client_name = body_data.get('client_name')
            amount = body_data.get('amount')
            profit = body_data.get('profit')
            deal_date = body_data.get('deal_date')
            
            if not all([client_name, amount, profit, deal_date]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                INSERT INTO deals (client_name, amount, profit, status, created_by, deal_date)
                VALUES (%s, %s, %s, 'pending', 1, %s)
                RETURNING id, client_name, amount, profit, status, deal_date
            ''', (client_name, amount, profit, deal_date))
            
            row = cursor.fetchone()
            conn.commit()
            
            new_deal = {
                'id': row[0],
                'client': row[1],
                'amount': float(row[2]),
                'profit': float(row[3]),
                'status': row[4],
                'date': row[5].strftime('%d.%m.%Y')
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'deal': new_deal}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            deal_id = body_data.get('id')
            status = body_data.get('status')
            
            if not deal_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Deal ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                UPDATE deals 
                SET status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, status
            ''', (status, deal_id))
            
            row = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': row[0], 'status': row[1]}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()
