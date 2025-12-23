import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TradingDealsTable from '@/components/TradingDealsTable';

interface Deal {
  id: number;
  client: string;
  amount: number;
  status: 'active' | 'completed' | 'pending';
  date: string;
  profit: number;
}

const DEALS_API = 'https://functions.poehali.dev/2ccf8889-715d-43ff-b42e-ff0b840425ac';
const STATS_API = 'https://functions.poehali.dev/f3cad22a-cbff-4891-8866-19dd4a584477';

export default function Index() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [newDeal, setNewDeal] = useState({ client: '', amount: '', profit: '' });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    activeDeals: 0,
    salesData: [] as Array<{month: string, value: number}>,
    profitData: [] as Array<{month: string, value: number}>
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeals();
    loadStats();
  }, []);

  const loadDeals = async () => {
    try {
      const response = await fetch(DEALS_API);
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(STATS_API);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAddDeal = async () => {
    if (newDeal.client && newDeal.amount && newDeal.profit) {
      try {
        const response = await fetch(DEALS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: newDeal.client,
            amount: parseFloat(newDeal.amount),
            profit: parseFloat(newDeal.profit),
            deal_date: new Date().toISOString().split('T')[0]
          })
        });
        
        if (response.ok) {
          await loadDeals();
          await loadStats();
          setNewDeal({ client: '', amount: '', profit: '' });
        }
      } catch (error) {
        console.error('Failed to add deal:', error);
      }
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
    { id: 'deals', label: 'Сделки', icon: 'FileText' },
    { id: 'schedule', label: 'Расписание', icon: 'Calendar' },
    { id: 'reports', label: 'Отчеты', icon: 'BarChart3' },
    { id: 'salary', label: 'Зарплата', icon: 'Wallet' },
    { id: 'knowledge', label: 'База знаний', icon: 'BookOpen' },
    { id: 'finance', label: 'Финансы', icon: 'TrendingUp' },
    { id: 'wallets', label: 'Кошельки', icon: 'Coins' },
    { id: 'accounting', label: 'Бухгалтерия', icon: 'FileSpreadsheet' },
  ];

  const statusColors = {
    active: 'bg-blue-500',
    completed: 'bg-green-500',
    pending: 'bg-yellow-500',
  };

  const statusLabels = {
    active: 'Активна',
    completed: 'Завершена',
    pending: 'Ожидание',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-semibold">Экосистема</h1>
          <p className="text-sm text-sidebar-foreground/70 mt-1">Корпоративная платформа</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon name={item.icon as any} size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              А
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Администратор</p>
              <p className="text-xs text-sidebar-foreground/70">admin@company.ru</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Icon name="Settings" size={16} className="mr-2" />
              Настройки
            </Button>
          </div>
        </header>

        <div className="p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Общий оборот</CardTitle>
                    <Icon name="DollarSign" size={20} className="text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
                    <p className="text-xs text-muted-foreground mt-1">+12.5% к прошлому месяцу</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
                    <Icon name="TrendingUp" size={20} className="text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProfit.toLocaleString('ru-RU')} ₽</div>
                    <p className="text-xs text-muted-foreground mt-1">Рентабельность {stats.profitMargin}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Активных сделок</CardTitle>
                    <Icon name="Activity" size={20} className="text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeDeals}</div>
                    <p className="text-xs text-muted-foreground mt-1">Всего сделок: {deals.length}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Динамика продаж</CardTitle>
                    <CardDescription>Последние 3 месяца</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats.salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString('ru-RU') + ' ₽'}
                          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Рентабельность</CardTitle>
                    <CardDescription>Процент прибыли по месяцам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.profitData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          formatter={(value: number) => value + '%'}
                          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Последние сделки</CardTitle>
                  <CardDescription>Обзор недавних операций</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Прибыль</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.slice(0, 4).map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.client}</TableCell>
                          <TableCell>{deal.date}</TableCell>
                          <TableCell>{deal.amount.toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell className="text-green-600">+{deal.profit.toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${statusColors[deal.status]} text-white`}>
                              {statusLabels[deal.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'deals' && (
            <TradingDealsTable />
          )}

          {activeSection === 'old-deals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Управление сделками</h3>
                  <p className="text-sm text-muted-foreground">Все сделки с возможностью добавления и редактирования</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Новая сделка
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить сделку</DialogTitle>
                      <DialogDescription>Заполните данные о новой сделке</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">Клиент</Label>
                        <Input
                          id="client"
                          placeholder="Название компании или ИП"
                          value={newDeal.client}
                          onChange={(e) => setNewDeal({ ...newDeal, client: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Сумма сделки (₽)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="250000"
                          value={newDeal.amount}
                          onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profit">Ожидаемая прибыль (₽)</Label>
                        <Input
                          id="profit"
                          type="number"
                          placeholder="45000"
                          value={newDeal.profit}
                          onChange={(e) => setNewDeal({ ...newDeal, profit: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddDeal} className="w-full">
                        Добавить сделку
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Прибыль</TableHead>
                        <TableHead>Рентабельность</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-mono text-sm">{deal.id}</TableCell>
                          <TableCell className="font-medium">{deal.client}</TableCell>
                          <TableCell>{deal.date}</TableCell>
                          <TableCell className="font-semibold">{deal.amount.toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell className="text-green-600 font-semibold">
                            +{deal.profit.toLocaleString('ru-RU')} ₽
                          </TableCell>
                          <TableCell>{((deal.profit / deal.amount) * 100).toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${statusColors[deal.status]} text-white`}>
                              {statusLabels[deal.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Icon name="Eye" size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {!['dashboard', 'deals'].includes(activeSection) && (
            <Card>
              <CardHeader>
                <CardTitle>Раздел в разработке</CardTitle>
                <CardDescription>
                  Функционал "{menuItems.find(item => item.id === activeSection)?.label}" будет добавлен в следующих версиях
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Icon name="Construction" size={64} className="mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Скоро здесь появится полный функционал</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}