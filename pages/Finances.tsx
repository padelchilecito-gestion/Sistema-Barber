
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { TransactionType, Transaction } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Plus, X, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const QUICK_EXPENSE_TAGS = ['Alquiler', 'Luz', 'Sueldos', 'Insumos', 'Internet', 'Mantenimiento'];

const FinancesPage: React.FC = () => {
  const { transactions, addTransaction } = useApp();
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const data = [
    { name: 'Ingresos', value: totalIncome, color: '#f59e0b' }, // amber-500
    { name: 'Gastos', value: totalExpense, color: '#ef4444' }, // red-500
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description,
      amount: Number(amount),
      type
    };

    addTransaction(newTx);
    
    // Reset and close
    setAmount('');
    setDescription('');
    setType(TransactionType.EXPENSE);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Finanzas</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus size={18} /> Registrar
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Balance Total</p>
          <h3 className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>${balance}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-sm mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-green-500"/> Ingresos</p>
            <h3 className="text-2xl font-bold text-green-400">+${totalIncome}</h3>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <p className="text-slate-400 text-sm mb-1 flex items-center gap-2"><TrendingDown size={16} className="text-red-500"/> Gastos</p>
           <h3 className="text-2xl font-bold text-red-400">-${totalExpense}</h3>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* Chart Section */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="text-white font-semibold mb-4 w-full text-left">Distribución</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`$${value}`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-white font-semibold mb-4">Últimos Movimientos</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {transactions.slice().reverse().map(t => (
                      <div key={t.id} className="flex justify-between items-center py-3 border-b border-slate-700 last:border-0 hover:bg-slate-700/30 px-2 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {t.type === TransactionType.INCOME ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}
                              </div>
                              <div>
                                  <p className="text-white font-medium">{t.description}</p>
                                  <p className="text-xs text-slate-500">{t.date}</p>
                              </div>
                          </div>
                          <span className={`font-bold font-mono ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                              {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount}
                          </span>
                      </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-8">No hay movimientos registrados.</p>
                  )}
              </div>
          </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Wallet className="text-amber-500" /> Registrar Movimiento
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type Toggle */}
                    <div className="bg-slate-900 p-1 rounded-xl flex">
                        <button
                          type="button" 
                          onClick={() => setType(TransactionType.EXPENSE)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                           <ArrowDownCircle size={16} /> Gasto
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setType(TransactionType.INCOME)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                           <ArrowUpCircle size={16} /> Ingreso
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Monto ($)</label>
                        <input 
                          type="number" 
                          required 
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-2xl text-white font-mono focus:border-amber-500 outline-none placeholder:text-slate-600"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Descripción</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: Pago de Luz"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                        />
                        
                        {/* Quick Tags for Expenses */}
                        {type === TransactionType.EXPENSE && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {QUICK_EXPENSE_TAGS.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setDescription(tag)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full border border-slate-600 transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    <button 
                      type="submit" 
                      className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${type === TransactionType.EXPENSE ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'}`}
                    >
                        Guardar {type === TransactionType.EXPENSE ? 'Gasto' : 'Ingreso'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;
