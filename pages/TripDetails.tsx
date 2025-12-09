import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { ExpenseCategory, Expense } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { ArrowLeft, Plus, Users, Receipt, Check, ArrowRightLeft, Trash2 } from 'lucide-react';

const TripDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, endTrip, addExpense, updateExpense, deleteExpense, currencySymbol, userProfile } = useTrips();
  const trip = getTrip(id || '');

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [showMySplitsOnly, setShowMySplitsOnly] = useState(false);
  
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  React.useEffect(() => {
    if (isExpenseModalOpen && trip) {
      if (editingExpense) {
        setAmount(editingExpense.amount.toString());
        setDescription(editingExpense.description || '');
        setCategory(editingExpense.category);
        setPaidBy(editingExpense.paidBy);
        setSplitAmong(editingExpense.splitAmong);
      } else {
        setPaidBy(trip.members[0]);
        setSplitAmong(trip.members);
        setCategory(ExpenseCategory.FOOD);
        setAmount('');
        setDescription('');
      }
    }
  }, [isExpenseModalOpen, trip, editingExpense]);

  const debts = useMemo(() => {
    if (!trip) return [];
    
    const balances: Record<string, number> = {};
    trip.members.forEach(m => balances[m] = 0);

    trip.expenses.forEach(e => {
      const paidBy = e.paidBy;
      const amount = e.amount;
      const splitCount = e.splitAmong.length;
      if (splitCount === 0) return;
      
      const splitAmount = amount / splitCount;

      balances[paidBy] = (balances[paidBy] || 0) + amount;
      e.splitAmong.forEach(member => {
        balances[member] = (balances[member] || 0) - splitAmount;
      });
    });

    const debtors: { member: string; amount: number }[] = [];
    const creditors: { member: string; amount: number }[] = [];

    Object.entries(balances).forEach(([member, amount]) => {
      if (amount < -0.01) debtors.push({ member, amount }); 
      if (amount > 0.01) creditors.push({ member, amount }); 
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: { from: string; to: string; amount: number }[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

      transactions.push({ from: debtor.member, to: creditor.member, amount: amount });
      debtor.amount += amount;
      creditor.amount -= amount;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transactions;
  }, [trip]);

  const displayedDebts = useMemo(() => {
    if (showMySplitsOnly) {
        return debts.filter(t => t.from === userProfile.name || t.to === userProfile.name);
    }
    return debts;
  }, [debts, showMySplitsOnly, userProfile.name]);

  if (!trip) return <div className="p-6 text-center text-neutral-500">Event not found</div>;

  const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleEndTrip = () => {
    endTrip(trip.id);
    setIsEndModalOpen(false);
    navigate('/history');
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleExpenseClick = (expense: Expense) => {
    if (trip.status === 'ended') {
      setViewingExpense(expense);
      setIsViewModalOpen(true);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    // Immediate deletion without confirmation
    deleteExpense(trip.id, expenseId);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paidBy || splitAmong.length === 0) return;

    if (editingExpense) {
        updateExpense(trip.id, {
            ...editingExpense,
            amount: parseFloat(amount),
            description,
            category,
            paidBy,
            splitAmong
        });
    } else {
        addExpense(trip.id, {
            amount: parseFloat(amount),
            description,
            category,
            paidBy,
            splitAmong
        });
    }

    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const toggleSplitMember = (member: string) => {
    if (splitAmong.includes(member)) {
      if (splitAmong.length > 1) { // Prevent empty split
        setSplitAmong(splitAmong.filter(m => m !== member));
      }
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-200">
      {/* Fixed Header */}
      <div className="shrink-0 z-20 bg-white dark:bg-black px-4 py-3 flex justify-between items-center transition-colors border-b border-neutral-100 dark:border-neutral-900">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-neutral-900 dark:text-white truncate max-w-[200px]">{trip.name}</h1>
        {trip.status === 'ongoing' ? (
             <button 
             onClick={() => setIsEndModalOpen(true)}
             className="text-red-500 font-medium text-sm px-3 py-1 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
           >
             End
           </button>
        ) : <div className="w-8" />}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-4 pb-28">
            {/* Gradient Summary Card */}
            <div className="bg-brand-gradient rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20 dark:shadow-none mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-white/80 text-sm font-medium mb-1">Total Expenses</div>
                    <div className="flex justify-between items-end">
                        <div className="text-5xl font-bold tracking-tight">{currencySymbol}{totalSpent.toFixed(2)}</div>
                        
                        {/* BIG SQUARED SPLIT BUTTON */}
                        <button 
                        onClick={() => setIsDebtModalOpen(true)}
                        className="w-24 h-24 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-lg"
                        >
                        <ArrowRightLeft size={28} />
                        <span className="text-sm">Split</span>
                        </button>

                    </div>
                    <div className="flex items-center gap-2 text-sm mt-6">
                        <div className="flex -space-x-2">
                             {trip.members.slice(0, 4).map((m,i) => (
                                 <div key={i} className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold uppercase">{m.charAt(0)}</div>
                             ))}
                        </div>
                        <span className="text-white/80 ml-2">{trip.members.length} members</span>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Activity</h3>
                {trip.status === 'ongoing' && <span className="text-xs text-neutral-400 uppercase tracking-wide font-bold">Swipe to delete</span>}
            </div>
            
            <div className="space-y-3">
                {trip.expenses.length === 0 && (
                    <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 text-sm">
                        No expenses yet. Tap + to start.
                    </div>
                )}
                {[...trip.expenses].reverse().map(expense => (
                    <SwipeableRow 
                        key={expense.id}
                        onDelete={() => handleDeleteExpense(expense.id)}
                        onEdit={() => openEditModal(expense)}
                        disabled={trip.status !== 'ongoing'}
                    >
                        <div 
                            onClick={() => handleExpenseClick(expense)}
                            className="group relative bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-transparent dark:border-neutral-800 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-black text-brand-pink flex items-center justify-center shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-800">
                                <Receipt size={22} />
                                </div>
                                <div>
                                    <div className="font-bold text-neutral-900 dark:text-white text-base">{expense.description || expense.category}</div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{expense.paidBy}</span> paid
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-neutral-900 dark:text-white text-lg group-hover:opacity-0 transition-opacity">
                                {currencySymbol}{expense.amount.toFixed(2)}
                            </div>
                            
                            {trip.status === 'ongoing' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExpense(expense.id);
                                        }}
                                        className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </SwipeableRow>
                ))}
            </div>
        </div>
      </div>

      {trip.status === 'ongoing' && (
        <button
          onClick={openAddModal}
          className="fixed bottom-24 right-6 w-16 h-16 bg-brand-gradient text-white rounded-2xl shadow-xl shadow-pink-500/30 flex items-center justify-center active:scale-90 transition-transform z-40"
        >
          <Plus size={32} />
        </button>
      )}

      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Event?"
      >
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            Are you sure you want to end <strong>{trip.name}</strong>? This will move it to history.
        </p>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsEndModalOpen(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleEndTrip}>End Event</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title="Who Owes Who"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Filter</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold transition-colors ${showMySplitsOnly ? 'text-brand-pink' : 'text-neutral-400'}`}>
                        {showMySplitsOnly ? 'My Splits' : 'All Splits'}
                    </span>
                    <button 
                        role="switch"
                        aria-checked={showMySplitsOnly}
                        onClick={() => setShowMySplitsOnly(!showMySplitsOnly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showMySplitsOnly ? 'bg-brand-pink' : 'bg-neutral-200 dark:bg-neutral-800'}`}
                    >
                        <span className={`${showMySplitsOnly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                    </button>
                </div>
          </div>

          {displayedDebts.length === 0 ? (
            <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 font-medium">
              All settled up!
            </div>
          ) : (
            displayedDebts.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${transaction.from === userProfile.name ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{transaction.from === userProfile.name ? 'You' : transaction.from}</span>
                  <span className="text-xs text-neutral-400">owes</span>
                  <span className={`font-bold ${transaction.to === userProfile.name ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{transaction.to === userProfile.name ? 'You' : transaction.to}</span>
                </div>
                <div className="font-bold text-brand-pink text-lg">
                  {currencySymbol}{transaction.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
          <Button variant="secondary" fullWidth onClick={() => setIsDebtModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-5">
            <div>
                <div className="relative flex items-center justify-center py-4">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-2xl">{currencySymbol}</span>
                    <input 
                        type="number" 
                        step="0.01" 
                        required
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full text-center py-2 bg-transparent border-b-2 border-neutral-100 dark:border-neutral-800 focus:border-brand-pink font-bold text-4xl text-neutral-900 dark:text-white placeholder-neutral-200 outline-none transition-colors"
                        placeholder="0"
                    />
                </div>
            </div>

            <div>
                <input 
                    type="text" 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink text-neutral-900 dark:text-white placeholder-neutral-400 font-medium"
                    placeholder="What was this for?"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ExpenseCategory).map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                category === c
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg transform scale-105'
                                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-500'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Paid By</label>
                    <select 
                        value={paidBy} 
                        onChange={e => setPaidBy(e.target.value)}
                        className="w-full px-3 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl border-none focus:ring-2 focus:ring-brand-pink text-sm font-bold text-neutral-900 dark:text-white outline-none"
                    >
                        {trip.members.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Split Among</label>
                <div className="grid grid-cols-2 gap-2">
                    {trip.members.map(member => {
                        const isSelected = splitAmong.includes(member);
                        return (
                            <button
                                key={member}
                                type="button"
                                onClick={() => toggleSplitMember(member)}
                                className={`relative px-3 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                    isSelected 
                                    ? 'bg-brand-pink/10 border-brand-pink text-brand-pink' 
                                    : 'bg-neutral-50 dark:bg-neutral-900 border-transparent text-neutral-400'
                                }`}
                            >
                                {member}
                                {isSelected && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-brand-pink rounded-full"></div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <Button type="submit" fullWidth className="mt-4">
                {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Expense Details"
      >
        {viewingExpense && (
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                    <span className="text-5xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                        {currencySymbol}{viewingExpense.amount.toFixed(2)}
                    </span>
                    <span className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider rounded-full">
                        {viewingExpense.category}
                    </span>
                </div>

                <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase">Description</label>
                    <p className="text-lg text-neutral-900 dark:text-white font-medium mt-1">
                        {viewingExpense.description || "No description provided."}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                    <span className="text-sm text-neutral-500 font-bold">Paid by</span>
                    <span className="font-bold text-neutral-900 dark:text-white text-lg">{viewingExpense.paidBy}</span>
                </div>

                <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase mb-2 block">Split Among</label>
                    <div className="flex flex-wrap gap-2">
                        {viewingExpense.splitAmong.length === trip.members.length ? (
                            <span className="w-full p-4 bg-brand-pink/10 text-brand-pink rounded-xl text-sm font-bold text-center">
                                Everyone
                            </span>
                        ) : (
                            viewingExpense.splitAmong.map(member => (
                                <span key={member} className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm font-bold">
                                    {member}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <Button variant="secondary" fullWidth onClick={() => setIsViewModalOpen(false)}>
                    Close
                </Button>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default TripDetails;