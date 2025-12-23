-- Таблица пользователей (сотрудников)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сделок
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    profit DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_by INTEGER REFERENCES users(id),
    deal_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица расписания
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица зарплат
CREATE TABLE IF NOT EXISTS salaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(15, 2) NOT NULL,
    bonus DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    total_salary DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица документов бухгалтерии
CREATE TABLE IF NOT EXISTS accounting_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    deal_id INTEGER REFERENCES deals(id),
    user_id INTEGER REFERENCES users(id),
    uploaded_by INTEGER REFERENCES users(id),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица базы знаний
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    file_url TEXT,
    created_by INTEGER REFERENCES users(id),
    is_published BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица крипто-кошельков
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id SERIAL PRIMARY KEY,
    wallet_name VARCHAR(255) NOT NULL,
    wallet_address TEXT NOT NULL,
    blockchain VARCHAR(50) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица финансовых отчетов
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(15, 2),
    total_profit DECIMAL(15, 2),
    total_expenses DECIMAL(15, 2),
    profit_margin DECIMAL(5, 2),
    data JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_date ON deals(deal_date);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_salaries_user ON salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_deal ON accounting_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_wallets_active ON crypto_wallets(is_active);

-- Вставка тестовых данных
INSERT INTO users (email, full_name, role, password_hash) VALUES
('admin@company.ru', 'Администратор', 'admin', 'hash_placeholder'),
('manager@company.ru', 'Менеджер Иванов', 'manager', 'hash_placeholder'),
('employee@company.ru', 'Сотрудник Петров', 'employee', 'hash_placeholder');

INSERT INTO deals (client_name, amount, profit, status, created_by, deal_date) VALUES
('ООО "Альфа"', 250000, 45000, 'completed', 1, '2024-12-15'),
('ИП Петров', 180000, 32000, 'active', 2, '2024-12-18'),
('ООО "Бета"', 420000, 75000, 'pending', 2, '2024-12-20'),
('ОАО "Гамма"', 310000, 55000, 'active', 1, '2024-12-21');