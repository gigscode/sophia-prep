import { useState, useEffect } from 'react';
import { adminUserService, type AdminUser, type UserFilters } from '../../services/admin-user-service';
import { Table } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { SearchBar } from '../ui/SearchBar';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { showToast } from '../ui/Toast';
import { Download, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({ status: 'all' });
  // const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  // const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    const { users: fetchedUsers, total: fetchedTotal } = await adminUserService.getAllUsers(
      filters,
      currentPage,
      itemsPerPage
    );
    setUsers(fetchedUsers);
    setTotal(fetchedTotal);
    setLoading(false);
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleEdit = (user: AdminUser) => {
    // setSelectedUser(user);
    // setShowEditModal(true);
    console.log('Edit user:', user);
  };

  const handleSuspend = async (userId: string, isActive: boolean) => {
    const success = isActive
      ? await adminUserService.suspendUser(userId)
      : await adminUserService.activateUser(userId);

    if (success) {
      showToast(isActive ? 'User suspended successfully' : 'User activated successfully', 'success');
      fetchUsers();
    } else {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    const success = await adminUserService.deleteUser(userToDelete);
    if (success) {
      showToast('User deleted successfully', 'success');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } else {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleExport = async () => {
    const csv = await adminUserService.exportUsersToCSV(filters);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Users exported successfully', 'success');
  };

  const columns = [
    { key: 'email', label: 'Email', sortable: true },
    { key: 'full_name', label: 'Name', sortable: true },
    {
      key: 'subscription_plan',
      label: 'Subscription',
      render: (user: AdminUser) => user.subscription_plan || 'Free',
    },
    {
      key: 'created_at',
      label: 'Registration Date',
      render: (user: AdminUser) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (user: AdminUser) => user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (user: AdminUser) => (
        <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {user.is_active ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(user)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleSuspend(user.id, user.is_active)}
            className="p-1 hover:bg-gray-100 rounded"
            title={user.is_active ? 'Suspend' : 'Activate'}
          >
            {user.is_active ? <Ban className="w-4 h-4" style={{ color: '#B78628' }} /> : <CheckCircle className="w-4 h-4 text-green-600" />}
          </button>
          <button
            onClick={() => {
              setUserToDelete(user.id);
              setShowDeleteDialog(true);
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchBar value={filters.search || ''} onChange={handleSearch} placeholder="Search by name or email..." />
        <Select
          value={filters.subscription || 'all'}
          onChange={(e) => handleFilterChange('subscription', e.target.value)}
          options={[
            { value: 'all', label: 'All Subscriptions' },
            { value: 'Free', label: 'Free' },
            { value: 'Basic', label: 'Basic' },
            { value: 'Premium', label: 'Premium' },
          ]}
        />
        <Select
          value={filters.status || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found" />
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={total}
        />
      </div>

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        type="warning"
        confirmText="Delete"
      />
    </div>
  );
}

