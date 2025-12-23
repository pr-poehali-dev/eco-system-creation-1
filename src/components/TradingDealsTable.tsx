import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const TRADING_DEALS_API = 'https://functions.poehali.dev/f2d1ddc6-8e93-48cf-8c3a-f809cc428d5e';

interface TradingDeal {
  id: number;
  trader_name: string;
  platform: 'PL' | 'Bliss';
  trade_date: string;
  buy_rub: number;
  buy_usd?: number;
  buy_rate?: number;
  buy_deal_id?: string;
  sell_rub?: number;
  sell_usdt?: number;
  sell_rate: number;
  sell_order_number?: string;
  profit_usd?: number;
  trader_profit?: number;
  is_finalized: boolean;
}

interface FormData {
  trader_name: string;
  platform: 'PL' | 'Bliss';
  trade_date: string;
  buy_rub: string;
  buy_usd: string;
  buy_rate: string;
  buy_deal_id: string;
  sell_rate: string;
  sell_order_number: string;
}

export default function TradingDealsTable() {
  const [deals, setDeals] = useState<TradingDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<TradingDeal | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    trader_name: '',
    platform: 'PL',
    trade_date: new Date().toISOString().split('T')[0],
    buy_rub: '',
    buy_usd: '',
    buy_rate: '',
    buy_deal_id: '',
    sell_rate: '',
    sell_order_number: ''
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const response = await fetch(TRADING_DEALS_API);
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFields = () => {
    const buy_rub = parseFloat(formData.buy_rub) || 0;
    const buy_usd = parseFloat(formData.buy_usd) || 0;
    const buy_rate = parseFloat(formData.buy_rate) || 0;
    const sell_rate = parseFloat(formData.sell_rate) || 0;

    const calculated = {
      buy_usd_calc: 0,
      buy_rate_calc: 0,
      sell_rub: buy_rub,
      sell_usdt: 0,
      profit_usd: 0,
      trader_profit: 0
    };

    if (formData.platform === 'PL') {
      calculated.buy_usd_calc = buy_rate ? buy_rub / buy_rate : 0;
      calculated.buy_rate_calc = buy_rate;
    } else {
      calculated.buy_usd_calc = buy_usd;
      calculated.buy_rate_calc = buy_usd ? buy_rub / buy_usd : 0;
    }

    calculated.sell_usdt = sell_rate ? buy_rub / sell_rate : 0;
    calculated.profit_usd = calculated.sell_usdt - calculated.buy_usd_calc;
    calculated.trader_profit = calculated.profit_usd * 0.0025;

    return calculated;
  };

  const calculated = calculateFields();

  const handleSubmit = async () => {
    if (!formData.trader_name || !formData.buy_rub || !formData.sell_rate) {
      alert('Заполните обязательные поля: Имя трейдера, Сумма в рублях (покупка), Курс продажи');
      return;
    }

    const payload: any = {
      trader_name: formData.trader_name,
      platform: formData.platform,
      trade_date: formData.trade_date,
      buy_rub: parseFloat(formData.buy_rub),
      sell_rate: parseFloat(formData.sell_rate),
      buy_deal_id: formData.buy_deal_id || null,
      sell_order_number: formData.sell_order_number || null
    };

    if (formData.platform === 'PL') {
      payload.buy_rate = parseFloat(formData.buy_rate);
    } else {
      payload.buy_usd = parseFloat(formData.buy_usd);
    }

    try {
      const url = editingDeal ? TRADING_DEALS_API : TRADING_DEALS_API;
      const method = editingDeal ? 'PUT' : 'POST';
      
      if (editingDeal) {
        payload.id = editingDeal.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadDeals();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save deal:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      trader_name: '',
      platform: 'PL',
      trade_date: new Date().toISOString().split('T')[0],
      buy_rub: '',
      buy_usd: '',
      buy_rate: '',
      buy_deal_id: '',
      sell_rate: '',
      sell_order_number: ''
    });
    setEditingDeal(null);
  };

  const handleEdit = (deal: TradingDeal) => {
    setEditingDeal(deal);
    setFormData({
      trader_name: deal.trader_name,
      platform: deal.platform,
      trade_date: deal.trade_date,
      buy_rub: deal.buy_rub?.toString() || '',
      buy_usd: deal.buy_usd?.toString() || '',
      buy_rate: deal.buy_rate?.toString() || '',
      buy_deal_id: deal.buy_deal_id || '',
      sell_rate: deal.sell_rate?.toString() || '',
      sell_order_number: deal.sell_order_number || ''
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Трейдинговые сделки</h3>
          <p className="text-sm text-muted-foreground">Ежедневная финализация сделок с автоматическими расчетами</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Icon name="Plus" size={16} className="mr-2" />
              Новая сделка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDeal ? 'Редактировать сделку' : 'Добавить сделку'}</DialogTitle>
              <DialogDescription>
                Заполните данные сделки. Поля с формулами рассчитываются автоматически.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trader_name">Имя трейдера *</Label>
                  <Input
                    id="trader_name"
                    placeholder="Иванов И.И."
                    value={formData.trader_name}
                    onChange={(e) => setFormData({ ...formData, trader_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform">Площадка *</Label>
                  <Select value={formData.platform} onValueChange={(value: 'PL' | 'Bliss') => setFormData({ ...formData, platform: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PL">PL</SelectItem>
                      <SelectItem value="Bliss">Bliss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_date">Дата сделки *</Label>
                  <Input
                    id="trade_date"
                    type="date"
                    value={formData.trade_date}
                    onChange={(e) => setFormData({ ...formData, trade_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Покупка</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buy_rub">Сумма в рублях *</Label>
                    <Input
                      id="buy_rub"
                      type="number"
                      placeholder="500000"
                      value={formData.buy_rub}
                      onChange={(e) => setFormData({ ...formData, buy_rub: e.target.value })}
                    />
                  </div>

                  {formData.platform === 'Bliss' ? (
                    <div className="space-y-2">
                      <Label htmlFor="buy_usd">Сумма в долларе * (ручное)</Label>
                      <Input
                        id="buy_usd"
                        type="number"
                        step="0.01"
                        placeholder="5000.00"
                        value={formData.buy_usd}
                        onChange={(e) => setFormData({ ...formData, buy_usd: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Сумма в долларе (формула)</Label>
                      <Input
                        type="number"
                        value={calculated.buy_usd_calc.toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}

                  {formData.platform === 'PL' ? (
                    <div className="space-y-2">
                      <Label htmlFor="buy_rate">Курс покупки * (ручное)</Label>
                      <Input
                        id="buy_rate"
                        type="number"
                        step="0.01"
                        placeholder="99.50"
                        value={formData.buy_rate}
                        onChange={(e) => setFormData({ ...formData, buy_rate: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Курс покупки (формула)</Label>
                      <Input
                        type="number"
                        value={calculated.buy_rate_calc.toFixed(4)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="buy_deal_id">ID сделки</Label>
                    <Input
                      id="buy_deal_id"
                      placeholder="BUY-001"
                      value={formData.buy_deal_id}
                      onChange={(e) => setFormData({ ...formData, buy_deal_id: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Продажа</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Сумма в рублях (= покупка)</Label>
                    <Input
                      type="number"
                      value={calculated.sell_rub}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Сумма в USDT (формула)</Label>
                    <Input
                      type="number"
                      value={calculated.sell_usdt.toFixed(4)}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell_rate">Курс продажи * (ручное)</Label>
                    <Input
                      id="sell_rate"
                      type="number"
                      step="0.01"
                      placeholder="98.50"
                      value={formData.sell_rate}
                      onChange={(e) => setFormData({ ...formData, sell_rate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell_order_number">№ ордера</Label>
                    <Input
                      id="sell_order_number"
                      placeholder="SELL-001"
                      value={formData.sell_order_number}
                      onChange={(e) => setFormData({ ...formData, sell_order_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Расчеты (автоматически)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Прибыль (USD)</Label>
                    <Input
                      type="number"
                      value={calculated.profit_usd.toFixed(4)}
                      disabled
                      className="bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Прибыль трейдера (0.25%)</Label>
                    <Input
                      type="number"
                      value={calculated.trader_profit.toFixed(4)}
                      disabled
                      className="bg-white font-semibold text-green-600"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingDeal ? 'Обновить сделку' : 'Добавить сделку'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Дата</TableHead>
                  <TableHead className="min-w-[150px]">Трейдер</TableHead>
                  <TableHead>Площадка</TableHead>
                  <TableHead className="text-right">Покупка ₽</TableHead>
                  <TableHead className="text-right">Покупка $</TableHead>
                  <TableHead className="text-right">Курс пок.</TableHead>
                  <TableHead>ID сделки</TableHead>
                  <TableHead className="text-right">Продажа ₽</TableHead>
                  <TableHead className="text-right">Продажа USDT</TableHead>
                  <TableHead className="text-right">Курс прод.</TableHead>
                  <TableHead>№ ордера</TableHead>
                  <TableHead className="text-right">Прибыль $</TableHead>
                  <TableHead className="text-right">Трейдер %</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">
                      {new Date(deal.trade_date).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>{deal.trader_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        deal.platform === 'PL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {deal.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{deal.buy_rub?.toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="text-right">{deal.buy_usd?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{deal.buy_rate?.toFixed(4)}</TableCell>
                    <TableCell className="font-mono text-xs">{deal.buy_deal_id || '—'}</TableCell>
                    <TableCell className="text-right">{deal.sell_rub?.toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="text-right">{deal.sell_usdt?.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{deal.sell_rate?.toFixed(4)}</TableCell>
                    <TableCell className="font-mono text-xs">{deal.sell_order_number || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {deal.profit_usd ? `+${deal.profit_usd.toFixed(4)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {deal.trader_profit ? deal.trader_profit.toFixed(4) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(deal)}>
                        <Icon name="Edit" size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
