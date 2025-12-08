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
  
  // View Expense State
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Expense Form State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // Initialize defaults when modal opens
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

  if (!trip) return <div className="p-6 text-center text-slate-500 dark:text-slate-400">Event not found</div>;

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
    if (confirm("Delete this expense?")) {
        deleteExpense(trip.id, expenseId);
    }
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Fixed Header */}
      <div className="shrink-0 z-20 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm flex justify-between items-center transition-colors">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[200px]">{trip.name}</h1>
        {trip.status === 'ongoing' ? (
             <button 
             onClick={() => setIsEndModalOpen(true)}
             className="text-red-600 dark:text-red-400 font-medium text-sm px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
           >
             End
           </button>
        ) : <div className="w-8" />}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-4 pb-28"> {/* pb-28 to ensure content isn't hidden behind FAB */}
            {/* Summary Card */}
            <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none mb-6">
            <div className="text-blue-100 dark:text-blue-200 text-sm mb-1">Total Expenses</div>
            <div className="flex justify-between items-end">
                <div className="text-4xl font-bold">{currencySymbol}{totalSpent.toFixed(2)}</div>
                <button 
                onClick={() => setIsDebtModalOpen(true)}
                className="bg-white/25 hover:bg-white/35 text-white px-6 py-3 rounded-xl text-base font-bold flex items-center gap-2 backdrop-blur-md shadow-sm transition-all active:scale-95"
                >
                <ArrowRightLeft size={18} />
                Split
                </button>
            </div>
            <div className="flex items-center gap-2 text-sm bg-blue-700/50 dark:bg-blue-800/50 p-2 rounded-lg w-fit mt-4">
                <Users size={14} />
                <span>{trip.members.length} members</span>
            </div>
            </div>

            {/* Expenses List */}
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-slate-800 dark:text-white">Recent Expenses</h3>
                {trip.status === 'ongoing' && <span className="text-xs text-slate-400">Swipe left to delete</span>}
            </div>
            
            <div className="space-y-0">
                {trip.expenses.length === 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                        No expenses yet. Add one!
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
                            className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                <Receipt size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">{expense.description || expense.category}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{expense.paidBy}</span> paid for {expense.splitAmong.length === trip.members.length ? 'everyone' : `${expense.splitAmong.length} people`}
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:opacity-0 transition-opacity">
                                {currencySymbol}{expense.amount.toFixed(2)}
                            </div>
                            
                            {/* Hover Delete Button */}
                            {trip.status === 'ongoing' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExpense(expense.id);
                                        }}
                                        className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                        title="Delete Expense"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </SwipeableRow>
                ))}
            </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {trip.status === 'ongoing' && (
        <button
          onClick={openAddModal}
          className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-xl shadow-blue-300 dark:shadow-blue-900/50 flex items-center justify-center active:scale-90 transition-transform z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* End Trip Confirmation Modal */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Event?"
      >
        <p className="text-slate-600 dark:text-slate-300 mb-6">
            Are you sure you want to end <strong>{trip.name}</strong>? This will move it to history.
        </p>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsEndModalOpen(false)}>No</Button>
            <Button variant="danger" fullWidth onClick={handleEndTrip}>Yes, End it</Button>
        </div>
      </Modal>

      {/* Debts/Split Modal */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title="Who Owes Who"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filter Splits</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium transition-colors ${showMySplitsOnly ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        {showMySplitsOnly ? 'My Splits' : 'All Splits'}
                    </span>
                    <button 
                        role="switch"
                        aria-checked={showMySplitsOnly}
                        onClick={() => setShowMySplitsOnly(!showMySplitsOnly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showMySplitsOnly ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <span className={`${showMySplitsOnly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                    </button>
                </div>
          </div>

          {displayedDebts.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              {showMySplitsOnly ? "You don't owe or receive anything!" : "Everything is settled up!"}
            </div>
          ) : (
            displayedDebts.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${transaction.from === userProfile.name ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{transaction.from === userProfile.name ? 'You' : transaction.from}</span>
                  <span className="text-xs text-slate-400">owes</span>
                  <span className={`font-bold ${transaction.to === userProfile.name ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{transaction.to === userProfile.name ? 'You' : transaction.to}</span>
                </div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{transaction.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
          <Button variant="secondary" fullWidth onClick={() => setIsDebtModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                    <input 
                        type="number" 
                        step="0.01" 
                        required
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-slate-900 dark:text-white placeholder-slate-400"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description (Optional)</label>
                <input 
                    type="text" 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="e.g. Dinner at Mario's"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ExpenseCategory).map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                category === c
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Paid By</label>
                <select 
                    value={paidBy} 
                    onChange={e => setPaidBy(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
                >
                    {trip.members.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Split Among</label>
                <div className="grid grid-cols-2 gap-2">
                    {trip.members.map(member => {
                        const isSelected = splitAmong.includes(member);
                        return (
                            <button
                                key={member}
                                type="button"
                                onClick={() => toggleSplitMember(member)}
                                className={`relative px-3 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                                    isSelected 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {member}
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <Button type="submit" fullWidth className="mt-4">
                {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
        </form>
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Expense Details"
      >
        {viewingExpense && (
            <div className="space-y-6">
                {/* Amount & Category */}
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        {currencySymbol}{viewingExpense.amount.toFixed(2)}
                    </span>
                    <span className="px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">
                        {viewingExpense.category}
                    </span>
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Description</label>
                    <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">
                        {viewingExpense.description || "No description provided."}
                    </p>
                </div>

                {/* Paid By */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Paid by</span>
                    <span className="font-bold text-slate-900 dark:text-white">{viewingExpense.paidBy}</span>
                </div>

                {/* Split Among */}
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Split Among</label>
                    <div className="flex flex-wrap gap-2">
                        {viewingExpense.splitAmong.length === trip.members.length ? (
                            <span className="w-full p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold text-center">
                                Everyone
                            </span>
                        ) : (
                            viewingExpense.splitAmong.map(member => (
                                <span key={member} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
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