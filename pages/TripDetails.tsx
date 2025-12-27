/**
 * The TripDetails page is where the actual splitting happens.
 * Here you see the total spend, who is in the trip, the receipt log, 
 * and most importantly, the "Who Owes Who" balance summary.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { ExpenseCategory, Expense } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { 
  ArrowLeft, Plus, Receipt, ArrowRightLeft, Trash2, UserMinus, 
  ChevronLeft, ChevronRight, AlertTriangle, Utensils, Car, 
  Ticket, Home, MoreHorizontal, UserPlus, Search, Check, Clock, X, Info
} from 'lucide-react';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  [ExpenseCategory.FOOD]: <Utensils size={16} />,
  [ExpenseCategory.TRAVEL]: <Car size={16} />,
  [ExpenseCategory.TICKETS]: <Ticket size={16} />,
  [ExpenseCategory.ACCOMMODATION]: <Home size={16} />,
  [ExpenseCategory.OTHER]: <MoreHorizontal size={16} />,
};

const TripDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // [PULL POINT] Getting trip data and notifications from global context
  const { getTrip, endTrip, addExpense, updateExpense, deleteExpense, addMemberToTrip, removeMemberFromTrip, currencySymbol, userProfile, friends, inviteFriendToTrip, sentNotifications } = useTrips();
  const trip = getTrip(id || '');

  // UI state for showing/hiding pop-up windows
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);
  const [showMySplitsOnly, setShowMySplitsOnly] = useState(false);
  
  // Managing people in the event
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isInviteFriendModalOpen, setIsInviteFriendModalOpen] = useState(false);
  const [friendToInvite, setFriendToInvite] = useState<string | null>(null);
  const [friendSearch, setFriendSearch] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<string | null>(null);
  const [isRemovingMemberConfirm, setIsRemovingMemberConfirm] = useState(false);

  // Horizontal scroll logic for member list
  const memberListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form fields for adding a new receipt
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // [PULL POINT] Filtering notifications to show status of people invited to this specific trip
  const tripInvitations = useMemo(() => {
    if (!trip) return [];
    // String conversion ensures IDs match correctly for comparison
    return sentNotifications.filter(n => String(n.tripId) === String(trip.id));
  }, [sentNotifications, trip]);

  const pendingInvites = tripInvitations.filter(n => n.status === 'PENDING');
  const rejectedInvites = tripInvitations.filter(n => n.status === 'DECLINED');

  const displayMembers = useMemo(() => {
    if (!trip) return [];
    const baseMembers = [...trip.members];
    if (editingExpense) {
        if (!baseMembers.includes(editingExpense.paidBy)) baseMembers.push(editingExpense.paidBy);
        editingExpense.splitAmong.forEach(m => {
            if (!baseMembers.includes(m)) baseMembers.push(m);
        });
    }
    return Array.from(new Set(baseMembers));
  }, [trip, editingExpense]);

  const checkScrollButtons = () => {
    if (memberListRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = memberListRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const timeout = setTimeout(checkScrollButtons, 100);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
        window.removeEventListener('resize', checkScrollButtons);
        clearTimeout(timeout);
    };
  }, [trip?.members, tripInvitations]);

  const scrollMembers = (direction: 'left' | 'right') => {
    if (memberListRef.current) {
        const scrollAmount = 200; 
        const newScrollLeft = memberListRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
        memberListRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }
  };

  // Reset form when opening the "Add Expense" popup
  React.useEffect(() => {
    if (isExpenseModalOpen && trip) {
      if (editingExpense) {
        setAmount(editingExpense.amount.toString());
        setDescription(editingExpense.description || '');
        setCategory(editingExpense.category);
        setPaidBy(editingExpense.paidBy);
        setSplitAmong(editingExpense.splitAmong);
      } else {
        const defaultPayer = trip.members.includes(userProfile.name) ? userProfile.name : (trip.members[0] || '');
        setPaidBy(defaultPayer);
        setSplitAmong(trip.members);
        setCategory(ExpenseCategory.FOOD);
        setAmount('');
        setDescription('');
      }
    }
  }, [isExpenseModalOpen, trip, editingExpense, userProfile.name]);

  /**
   * The "Math Core": This calculates how to settle up.
   * It takes all receipts and figures out the minimum number of payments 
   * needed to get everyone to zero.
   */
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

  const filteredFriends = useMemo(() => {
    if (!trip) return [];
    return friends.filter(f => 
        !trip.members.includes(f.username) &&
        !tripInvitations.some(inv => inv.toUsername === f.username && inv.status === 'PENDING') &&
        f.username.toLowerCase().includes(friendSearch.toLowerCase())
    );
  }, [friends, trip, friendSearch, tripInvitations]);

  if (!trip) return <div className="p-6 text-center text-neutral-500 font-bold">Event not found</div>;

  const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  /**
   * Action: Ends the trip and moves it to history.
   * [PUSH POINT] Updates state locally and eventually pushes to Turso.
   */
  const handleEndTrip = () => {
    endTrip(trip.id);
    setIsEndModalOpen(false);
    navigate('/history');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim() && !trip.members.includes(newMemberName.trim())) {
      addMemberToTrip(trip.id, newMemberName.trim());
      setNewMemberName('');
      setIsAddMemberModalOpen(false);
    }
  };

  const handleInviteFriend = (friendUsername: string) => {
    setFriendToInvite(friendUsername);
  };

  /**
   * [PUSH POINT - TURSO CLOUD]
   * Triggers an invitation into the cloud database via context logic.
   */
  const confirmInviteFriend = async () => {
    if (!friendToInvite) return;
    try {
        await inviteFriendToTrip(friendToInvite, trip.id, trip.name);
        setIsInviteFriendModalOpen(false);
        setFriendSearch('');
        setFriendToInvite(null);
    } catch (err: any) {
        alert(err.message || "Failed to invite friend.");
        setFriendToInvite(null);
    }
  };

  const initiateRemoveMember = () => {
    setIsRemovingMemberConfirm(true);
  };

  const confirmRemoveMember = () => {
    if (selectedMemberForAction) {
      removeMemberFromTrip(trip.id, selectedMemberForAction);
      setSelectedMemberForAction(null);
      setIsRemovingMemberConfirm(false);
    }
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
    } else {
      openEditModal(expense);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense(trip.id, expenseId);
  };

  /**
   * Saves a receipt into the event.
   * [PUSH POINT] Local state update which triggers a Cloud Sync batch.
   */
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
      if (splitAmong.length > 1) { 
        setSplitAmong(splitAmong.filter(m => m !== member));
      }
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  const isOwner = (name: string) => trip.participants.includes(name);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-200">
      {/* Header with Back button and End Event button */}
      <div className="shrink-0 z-20 bg-white dark:bg-black px-4 py-3 flex justify-between items-center transition-colors border-b border-neutral-100 dark:border-neutral-900">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-neutral-900 dark:text-white truncate max-w-[200px]">{trip.name}</h1>
        {trip.status === 'ongoing' ? (
             <button 
                type="button" 
                onClick={() => setIsEndModalOpen(true)} 
                className="text-red-500 font-bold text-sm px-3 py-1 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors"
             >
               End
             </button>
        ) : <div className="w-8" />}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-4 pb-28">
            {/* Total Spending Summary Card */}
            <div className="bg-brand-gradient rounded-[2rem] p-6 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-white/80 text-sm font-medium mb-1">Total Spending</div>
                    <div className="flex justify-between items-end">
                        <div className="text-5xl font-bold tracking-tight">{currencySymbol}{totalSpent.toFixed(2)}</div>
                        <button 
                          type="button"
                          onClick={() => setIsDebtModalOpen(true)}
                          className="w-24 h-24 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-lg"
                        >
                          <ArrowRightLeft size={28} />
                          <span className="text-sm">Split</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Members Section (Avatar list) */}
            <div className="mb-6">
                <div className="flex items-center justify-between px-2 mb-3">
                    <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Members</h3>
                    <button 
                      type="button"
                      onClick={() => setIsInvitesModalOpen(true)}
                      className="text-xs font-bold text-brand-pink bg-brand-pink/5 hover:bg-brand-pink/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 border border-brand-pink/10 shadow-sm"
                    >
                        <Info size={12} />
                        Status ({(pendingInvites.length + rejectedInvites.length)})
                    </button>
                </div>
                
                <div className="relative">
                    {canScrollLeft && (
                        <button type="button" onClick={() => scrollMembers('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-r-xl shadow-lg border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    <div 
                        ref={memberListRef}
                        onScroll={checkScrollButtons}
                        className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 scrollbar-none snap-x items-center"
                    >
                        {trip.status === 'ongoing' && (
                            <div className="flex gap-2 relative z-30 pointer-events-auto">
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setIsAddMemberModalOpen(true); }} 
                                    className="flex flex-col items-center gap-2 min-w-[60px] snap-start group relative z-40"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400 hover:border-brand-pink transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-400 group-hover:text-brand-pink">Guest</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setIsInviteFriendModalOpen(true); }} 
                                    className="flex flex-col items-center gap-2 min-w-[60px] snap-start group relative z-40"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-brand-pink/5 border-2 border-dashed border-brand-pink/30 flex items-center justify-center text-brand-pink hover:bg-brand-pink/10 transition-colors">
                                        <UserPlus size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-pink">Invite</span>
                                </button>
                            </div>
                        )}

                        {trip.members.map((member) => {
                            const owner = isOwner(member);
                            return (
                                <div 
                                    key={member} 
                                    onClick={() => trip.status === 'ongoing' && setSelectedMemberForAction(member)}
                                    className="flex flex-col items-center gap-2 min-w-[60px] snap-start cursor-pointer active:scale-95 transition-transform"
                                >
                                    <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm border-2 ${member === userProfile.name ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white' : 'bg-white text-neutral-700 border-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800'}`}>
                                        {member.charAt(0).toUpperCase()}
                                        {owner && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center">
                                                <Check size={10} className="text-white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold text-center truncate w-full px-1 ${owner ? 'text-neutral-900 dark:text-white font-black' : 'text-neutral-400'}`}>
                                        {member === userProfile.name ? 'You' : member}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {canScrollRight && (
                        <button type="button" onClick={() => scrollMembers('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-l-xl shadow-lg border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* List of every individual expense logged */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Expense Log</h3>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shared Event</span>
            </div>
            
            <div className="space-y-3">
                {trip.expenses.length === 0 && (
                    <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 text-sm italic">
                        No transactions recorded.
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
                            className="group relative bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-transparent dark:border-neutral-800 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer overflow-hidden shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-black text-brand-pink flex items-center justify-center shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-800">
                                  {CATEGORY_ICONS[expense.category] || <Receipt size={22} />}
                                </div>
                                <div>
                                    <div className="font-bold text-neutral-900 dark:text-white text-base">{expense.description || expense.category}</div>
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                        <span className="text-neutral-700 dark:text-neutral-300">{expense.paidBy}</span> paid
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-neutral-900 dark:text-white text-lg group-hover:opacity-0 transition-opacity">
                                {currencySymbol}{expense.amount.toFixed(2)}
                            </div>
                            
                            {/* Hover Delete Button for Desktop */}
                            {trip.status === 'ongoing' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-20 translate-x-4 group-hover:translate-x-0">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExpense(expense.id);
                                        }}
                                        className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all active:scale-95 shadow-sm border border-red-200 dark:border-red-800"
                                        title="Delete Expense"
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

      {/* Floating Add Button (+) */}
      {trip.status === 'ongoing' && (
        <button 
          type="button"
          onClick={openAddModal} 
          className="fixed bottom-24 right-6 w-16 h-16 bg-brand-gradient text-white rounded-2xl shadow-xl shadow-pink-500/30 flex items-center justify-center active:scale-90 transition-transform z-40"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Various Pop-up Modals for interactions */}
      <Modal isOpen={isEndModalOpen} onClose={() => setIsEndModalOpen(false)} title="End Event?">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full">
                <AlertTriangle size={32} />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Are you sure you want to end <strong>{trip.name}</strong>? All balances will be finalized and this event will move to your history.
            </p>
        </div>
        <div className="flex gap-3 mt-8">
            <Button variant="secondary" fullWidth onClick={() => setIsEndModalOpen(false)}>Discard</Button>
            <Button variant="danger" fullWidth onClick={handleEndTrip}>Confirm End</Button>
        </div>
      </Modal>

      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title="Balance Summary">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Filter Overview</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${showMySplitsOnly ? 'text-brand-pink' : 'text-neutral-400'}`}>My Dues</span>
                    <button 
                        type="button"
                        aria-checked={showMySplitsOnly}
                        onClick={() => setShowMySplitsOnly(!showMySplitsOnly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showMySplitsOnly ? 'bg-brand-pink' : 'bg-neutral-200 dark:bg-neutral-800'}`}
                    >
                        <span className={`${showMySplitsOnly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                </div>
          </div>

          {displayedDebts.length === 0 ? (
            <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 font-medium italic">All settled up!</div>
          ) : (
            displayedDebts.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${transaction.from === userProfile.name ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{transaction.from === userProfile.name ? 'You' : transaction.from}</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">owes</span>
                  <span className={`font-bold ${transaction.to === userProfile.name ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>{transaction.to === userProfile.name ? 'You' : transaction.to}</span>
                </div>
                <div className="font-bold text-brand-pink text-lg">{currencySymbol}{transaction.amount.toFixed(2)}</div>
              </div>
            ))
          )}
          <Button variant="secondary" fullWidth onClick={() => setIsDebtModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpense ? "Modify Expense" : "New Expense"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-5">
            <div className="relative flex items-center justify-center py-4">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-300 font-bold text-2xl">{currencySymbol}</span>
                <input 
                    type="number" step="0.01" required value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-center py-2 bg-transparent border-b-2 border-neutral-100 dark:border-neutral-800 focus:border-brand-pink font-bold text-4xl text-neutral-900 dark:text-white outline-none transition-colors"
                    placeholder="0.00"
                />
            </div>
            <input 
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink text-neutral-900 dark:text-white placeholder-neutral-400 font-medium"
                placeholder="What was this for?"
            />
            <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ExpenseCategory).map(c => (
                        <button
                            key={c} type="button" onClick={() => setCategory(c)}
                            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${category === c ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500'}`}
                        >
                            {CATEGORY_ICONS[c]}
                            {c}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Payer</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full px-3 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl border-none focus:ring-2 focus:ring-brand-pink text-sm font-bold text-neutral-900 dark:text-white">
                        {displayMembers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Sharing With</label>
                <div className="grid grid-cols-2 gap-2">
                    {displayMembers.map(member => {
                        const isSelected = splitAmong.includes(member);
                        return (
                            <button
                                key={member} type="button" onClick={() => toggleSplitMember(member)}
                                className={`relative px-3 py-3 rounded-xl text-sm font-bold transition-all border-2 ${isSelected ? 'bg-brand-pink/10 border-brand-pink text-brand-pink' : 'bg-neutral-50 dark:bg-neutral-900 border-transparent text-neutral-400'}`}
                            >
                                {member}
                                {isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-brand-pink rounded-full"></div>}
                            </button>
                        )
                    })}
                </div>
            </div>
            <Button type="submit" fullWidth className="mt-4">{editingExpense ? 'Apply Changes' : 'Record Expense'}</Button>
        </form>
      </Modal>

      <Modal isOpen={isInviteFriendModalOpen} onClose={() => {setIsInviteFriendModalOpen(false); setFriendSearch('');}} title="Invite Owners">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" placeholder="Search friends..." value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm outline-none focus:border-brand-pink"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-none">
            {friends.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs font-medium italic">Add connections in the Friends tab!</div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs font-medium italic">No new friends to invite.</div>
            ) : (
              filteredFriends.map(friend => (
                <button
                  key={friend.username} type="button" onClick={() => handleInviteFriend(friend.username)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-brand-pink active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: friend.avatarColor }}>{friend.username.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{friend.username}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center"><Plus size={16} /></div>
                </button>
              ))
            )}
          </div>
          <Button variant="secondary" fullWidth onClick={() => setIsInviteFriendModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!friendToInvite}
        onClose={() => setFriendToInvite(null)}
        title="Invite Friend?"
      >
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-full">
            <UserPlus size={32} />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Invite <strong>{friendToInvite}</strong> to join this event?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setFriendToInvite(null)}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={confirmInviteFriend}>Send Invitation</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedMemberForAction && !isRemovingMemberConfirm}
        onClose={() => setSelectedMemberForAction(null)}
        title={isOwner(selectedMemberForAction || '') ? "Manage Ownership" : "Manage Member"}
      >
        <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-3xl font-bold mb-4">
                {selectedMemberForAction?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold">{selectedMemberForAction}</h3>
            <p className="text-neutral-500 text-sm mt-1">
                {isOwner(selectedMemberForAction || '') ? `Co-Owner of ${trip.name}` : `Guest Member in ${trip.name}`}
            </p>
        </div>
        <div className="space-y-3">
            <Button variant="danger" fullWidth onClick={initiateRemoveMember} className="flex items-center justify-center gap-2">
                <UserMinus size={18} /> {isOwner(selectedMemberForAction || '') ? 'Revoke Ownership' : 'Remove Member'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setSelectedMemberForAction(null)}>Cancel</Button>
        </div>
      </Modal>

      <Modal isOpen={isRemovingMemberConfirm} onClose={() => setIsRemovingMemberConfirm(false)} title={isOwner(selectedMemberForAction || '') ? "Revoke Ownership?" : "Remove Member?"}>
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full"><AlertTriangle size={32} /></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Are you sure you want to remove <strong>{selectedMemberForAction}</strong>? 
                {isOwner(selectedMemberForAction || '') 
                    ? " They will lose all cloud access to add or edit expenses." 
                    : " They will be deleted from the split participants list."}
            </p>
        </div>
        <div className="flex gap-3 mt-8">
            <Button variant="secondary" fullWidth onClick={() => setIsRemovingMemberConfirm(false)}>Back</Button>
            <Button variant="danger" fullWidth onClick={confirmRemoveMember}>Confirm Remove</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Local Guest"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-neutral-400 uppercase">Guest Name</label>
                <input 
                    type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-pink"
                    placeholder="Enter guest name" autoFocus
                />
            </div>
            <div className="flex gap-3">
                 <Button type="button" variant="secondary" fullWidth onClick={() => setIsAddMemberModalOpen(false)}>Cancel</Button>
                 <Button type="submit" fullWidth disabled={!newMemberName.trim()}>Add Guest</Button>
            </div>
        </form>
      </Modal>

      {/* Invitations Status Modal */}
      <Modal isOpen={isInvitesModalOpen} onClose={() => setIsInvitesModalOpen(false)} title="Invitation Status">
        <div className="space-y-6">
            <div>
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={14} /> Pending Responses
                </h4>
                <div className="space-y-2">
                    {pendingInvites.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No pending invitations.</p>
                    ) : (
                        pendingInvites.map(n => (
                            <div key={n.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">{n.toUsername}</span>
                                <span className="text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-0.5 rounded-full font-bold">WAITING</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <X size={14} /> Rejected Invites
                </h4>
                <div className="space-y-2">
                    {rejectedInvites.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No rejections yet.</p>
                    ) : (
                        rejectedInvites.map(n => (
                            <div key={n.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">{n.toUsername}</span>
                                <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500 px-2 py-0.5 rounded-full font-bold">DECLINED</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <Button variant="secondary" fullWidth onClick={() => setIsInvitesModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      {/* View Expense Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Expense Details">
        {viewingExpense && (
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto text-brand-pink">
                        {CATEGORY_ICONS[viewingExpense.category] || <Receipt size={32} />}
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{currencySymbol}{viewingExpense.amount.toFixed(2)}</div>
                    <div className="text-neutral-500 font-medium">{viewingExpense.description || viewingExpense.category}</div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px]">Paid By</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{viewingExpense.paidBy}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px]">Date</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{new Date(viewingExpense.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] block mb-2">Split Among</span>
                        <div className="flex flex-wrap gap-1.5">
                            {viewingExpense.splitAmong.map(m => (
                                <span key={m} className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <Button variant="secondary" fullWidth onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default TripDetails;