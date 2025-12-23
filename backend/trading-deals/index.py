import json
import os
import psycopg2
from typing import Dict, Any
from decimal import Decimal

def calculate_fields(platform: str, buy_rub: float, buy_usd: float, buy_rate: float, sell_rate: float):
    '''Расчет полей по формулам в зависимости от площадки'''
    result = {}
    
    if platform == 'PL':
        result['buy_usd'] = buy_rub / buy_rate if buy_rate else None
        result['buy_rate'] = buy_rate
    elif platform == 'Bliss':
        result['buy_usd'] = buy_usd
        result['buy_rate'] = buy_rub / buy_usd if buy_usd else None
    
    result['sell_rub'] = buy_rub
    result['sell_usdt'] = buy_rub / sell_rate if sell_rate else None
    
    if result['buy_usd'] and result['sell_usdt']:
        result['profit_usd'] = result['sell_usdt'] - result['buy_usd']
        result['trader_profit'] = result['profit_usd'] * 0.0025
    else:
        result['profit_usd'] = None
        result['trader_profit'] = None
    
    return result

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления трейдинговыми сделками с автоматическими расчетами
    Args: event - HTTP запрос с методом GET/POST/PUT
          context - контекст выполнения функции
    Returns: JSON с данными сделок
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
                SELECT id, trader_name, platform, trade_date,
                       buy_rub, buy_usd, buy_rate, buy_deal_id,
                       sell_rub, sell_usdt, sell_rate, sell_order_number,
                       profit_usd, trader_profit, is_finalized, created_at
                FROM trading_deals
                ORDER BY trade_date DESC, id DESC
            ''')
            
            deals = []
            for row in cursor.fetchall():
                deals.append({
                    'id': row[0],
                    'trader_name': row[1],
                    'platform': row[2],
                    'trade_date': row[3].strftime('%Y-%m-%d'),
                    'buy_rub': float(row[4]) if row[4] else None,
                    'buy_usd': float(row[5]) if row[5] else None,
                    'buy_rate': float(row[6]) if row[6] else None,
                    'buy_deal_id': row[7],
                    'sell_rub': float(row[8]) if row[8] else None,
                    'sell_usdt': float(row[9]) if row[9] else None,
                    'sell_rate': float(row[10]) if row[10] else None,
                    'sell_order_number': row[11],
                    'profit_usd': float(row[12]) if row[12] else None,
                    'trader_profit': float(row[13]) if row[13] else None,
                    'is_finalized': row[14]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'deals': deals}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            trader_name = body_data.get('trader_name')
            platform = body_data.get('platform', 'PL')
            trade_date = body_data.get('trade_date')
            buy_rub = body_data.get('buy_rub')
            buy_usd = body_data.get('buy_usd')
            buy_rate = body_data.get('buy_rate')
            buy_deal_id = body_data.get('buy_deal_id')
            sell_rate = body_data.get('sell_rate')
            sell_order_number = body_data.get('sell_order_number')
            
            calculated = calculate_fields(platform, buy_rub or 0, buy_usd or 0, buy_rate or 0, sell_rate or 0)
            
            cursor.execute('''
                INSERT INTO trading_deals (
                    trader_name, platform, trade_date,
                    buy_rub, buy_usd, buy_rate, buy_deal_id,
                    sell_rub, sell_usdt, sell_rate, sell_order_number,
                    profit_usd, trader_profit, is_finalized, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, false, 1)
                RETURNING id, trader_name, platform, trade_date, buy_rub, buy_usd, buy_rate,
                          sell_rub, sell_usdt, sell_rate, profit_usd, trader_profit
            ''', (
                trader_name, platform, trade_date,
                buy_rub, calculated['buy_usd'], calculated['buy_rate'], buy_deal_id,
                calculated['sell_rub'], calculated['sell_usdt'], sell_rate, sell_order_number,
                calculated['profit_usd'], calculated['trader_profit']
            ))
            
            row = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'deal': {
                        'id': row[0],
                        'trader_name': row[1],
                        'platform': row[2],
                        'trade_date': row[3].strftime('%Y-%m-%d'),
                        'buy_rub': float(row[4]) if row[4] else None,
                        'buy_usd': float(row[5]) if row[5] else None,
                        'buy_rate': float(row[6]) if row[6] else None,
                        'sell_rub': float(row[7]) if row[7] else None,
                        'sell_usdt': float(row[8]) if row[8] else None,
                        'sell_rate': float(row[9]) if row[9] else None,
                        'profit_usd': float(row[10]) if row[10] else None,
                        'trader_profit': float(row[11]) if row[11] else None
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            deal_id = body_data.get('id')
            
            if not deal_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Deal ID required'}),
                    'isBase64Encoded': False
                }
            
            platform = body_data.get('platform')
            buy_rub = body_data.get('buy_rub')
            buy_usd = body_data.get('buy_usd')
            buy_rate = body_data.get('buy_rate')
            sell_rate = body_data.get('sell_rate')
            
            calculated = calculate_fields(platform, buy_rub or 0, buy_usd or 0, buy_rate or 0, sell_rate or 0)
            
            cursor.execute('''
                UPDATE trading_deals 
                SET trader_name = %s, platform = %s, trade_date = %s,
                    buy_rub = %s, buy_usd = %s, buy_rate = %s, buy_deal_id = %s,
                    sell_rub = %s, sell_usdt = %s, sell_rate = %s, sell_order_number = %s,
                    profit_usd = %s, trader_profit = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            ''', (
                body_data.get('trader_name'), platform, body_data.get('trade_date'),
                buy_rub, calculated['buy_usd'], calculated['buy_rate'], body_data.get('buy_deal_id'),
                calculated['sell_rub'], calculated['sell_usdt'], sell_rate, body_data.get('sell_order_number'),
                calculated['profit_usd'], calculated['trader_profit'], deal_id
            ))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
