// src/pages/admin/verification/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAdminData } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import UserDetailsModal from '@/components/admin/UserDetailsModal'; // ADD THIS IMPORT
import VerificationBadge from '@/components/verifcation/VerificationBadge'; // Fixed typo
import {
    Search,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Download,
    MoreVertical,
    Eye,
    Mail,
    Phone,
    Clock,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';

// Interface matching the expected data structure from services
interface UserWithDetails {
    _id: string;
    name: string;
    email: string;
    role: 'candidate' | 'freelancer' | 'company' | 'organization' | 'admin';
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    profileCompleted?: boolean;
    phone?: string;
    location?: string;
    company?: string;
    verificationStatus?: 'none' | 'partial' | 'full';
    verificationDetails?: {
        profileVerified?: boolean;
        socialVerified?: boolean;
        documentsVerified?: boolean;
        emailVerified?: boolean;
        phoneVerified?: boolean;
        lastVerified?: string;
        verifiedBy?: string;
        verificationNotes?: string;
    };
    appointments?: any[];
    createdAt: string;
}

const AdminVerificationPage = () => {
    const { toast } = useToast();
    const { getUsers, updateUser } = useAdminData();

    const [users, setUsers] = useState<UserWithDetails[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        partial: 0,
        notVerified: 0,
        withAppointments: 0
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [verificationFilter, setVerificationFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state - MAKE SURE THESE ARE DEFINED
    const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock data for testing
    const mockUsers: UserWithDetails[] = [
        {
            _id: '68ce97419e1ddbd8e299880e',
            name: 'Nebiyou Girma',
            email: 'nebawale1111@gmail.com',
            role: 'candidate',
            status: 'active',
            profileCompleted: true,
            phone: '+251911223344',
            location: 'Addis Ababa, Ethiopia',
            verificationStatus: 'full',
            verificationDetails: {
                profileVerified: true,
                socialVerified: true,
                documentsVerified: true,
                emailVerified: true,
                phoneVerified: true,
                lastVerified: '2024-01-15T10:30:00Z',
                verifiedBy: 'Admin User',
                verificationNotes: 'All documents verified successfully'
            },
            appointments: [
                {
                    _id: 'app123456',
                    appointmentDate: '2024-03-15',
                    appointmentTime: '10:00 AM',
                    verificationType: 'candidate',
                    status: 'confirmed',
                    officeLocation: 'Main Office - 22 Meklit Building',
                    documents: ['id_card', 'academic_certificates', 'cv_resume'],
                    additionalNotes: 'Bring all original documents for verification'
                },
                {
                    _id: 'app789012',
                    appointmentDate: '2024-02-20',
                    appointmentTime: '2:30 PM',
                    verificationType: 'candidate',
                    status: 'completed',
                    officeLocation: 'Main Office - 22 Meklit Building',
                    documents: ['id_card', 'academic_certificates'],
                    additionalNotes: 'Documents verified successfully'
                }
            ],
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'freelancer',
            status: 'active',
            profileCompleted: true,
            phone: '+0987654321',
            location: 'London',
            verificationStatus: 'partial',
            verificationDetails: {
                profileVerified: true,
                socialVerified: false,
                documentsVerified: true,
                emailVerified: true,
                phoneVerified: false,
                lastVerified: '2024-01-10T14:20:00Z'
            },
            appointments: [
                {
                    _id: 'app2',
                    appointmentDate: '2024-01-25',
                    appointmentTime: '2:00 PM',
                    verificationType: 'freelancer',
                    status: 'confirmed',
                    officeLocation: 'Branch Office'
                }
            ],
            createdAt: '2024-01-05T00:00:00Z'
        },
        {
            _id: '3',
            name: 'Acme Inc',
            email: 'contact@acme.com',
            role: 'company',
            status: 'active',
            profileCompleted: true,
            company: 'Acme Corporation',
            location: 'San Francisco',
            verificationStatus: 'none',
            verificationDetails: {
                profileVerified: false,
                socialVerified: false,
                documentsVerified: false,
                emailVerified: true,
                phoneVerified: false
            },
            appointments: [],
            createdAt: '2024-01-10T00:00:00Z'
        }
    ];

    // Fetch users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    // Apply filters whenever dependencies change
    useEffect(() => {
        applyFilters();
    }, [users, searchTerm, statusFilter, roleFilter, verificationFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('Loading users...');

            // Try to fetch from API first
            try {
                const response = await getUsers();
                console.log('API response:', response);

                let usersData: UserWithDetails[] = [];

                // Handle different response structures
                if (Array.isArray(response)) {
                    usersData = response.map(user => ({
                        ...user,
                        verificationStatus: user.verificationStatus || 'none',
                        status: user.status || 'active',
                        profileCompleted: user.profileCompleted || false,
                        appointments: user.appointments || []
                    }));
                } else if (response?.data && Array.isArray(response.data)) {
                    usersData = response.data.map((user: any) => ({
                        ...user,
                        verificationStatus: user.verificationStatus || 'none',
                        status: user.status || 'active',
                        profileCompleted: user.profileCompleted || false,
                        appointments: user.appointments || []
                    }));
                } else if (response?.users && Array.isArray(response.users)) {
                    usersData = response.users.map((user: any) => ({
                        ...user,
                        verificationStatus: user.verificationStatus || 'none',
                        status: user.status || 'active',
                        profileCompleted: user.profileCompleted || false,
                        appointments: user.appointments || []
                    }));
                }

                if (usersData.length > 0) {
                    setUsers(usersData);
                    calculateStats(usersData);
                    return;
                }
            } catch (apiError) {
                console.log('API error, using mock data:', apiError);
                // Fallback to mock data
                setUsers(mockUsers);
                calculateStats(mockUsers);
                toast({
                    title: 'Info',
                    description: 'Using demo data. Backend not connected.',
                    variant: 'default'
                });
            }

        } catch (error: any) {
            console.error('Error loading users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load users. Using demo data.',
                variant: 'destructive'
            });

            // Always have mock data available
            setUsers(mockUsers);
            calculateStats(mockUsers);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (usersList: UserWithDetails[]) => {
        const stats = {
            total: usersList.length,
            verified: usersList.filter(u => u.verificationStatus === 'full').length,
            partial: usersList.filter(u => u.verificationStatus === 'partial').length,
            notVerified: usersList.filter(u => u.verificationStatus === 'none' || !u.verificationStatus).length,
            withAppointments: usersList.filter(u => u.appointments && u.appointments.length > 0).length
        };
        console.log('Stats calculated:', stats);
        setStats(stats);
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.company?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Verification filter
        if (verificationFilter !== 'all') {
            filtered = filtered.filter(user => user.verificationStatus === verificationFilter);
        }

        console.log('Filter applied. Showing:', filtered.length, 'users');
        setFilteredUsers(filtered);
        setCurrentPage(1);
    };

    const handleUpdateVerification = async (userId: string, status: 'none' | 'partial' | 'full') => {
        console.log('Updating verification for user:', userId, 'to:', status);
        try {
            await updateUser(userId, { verificationStatus: status });

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userId
                        ? { ...user, verificationStatus: status }
                        : user
                )
            );

            toast({
                title: 'Success',
                description: `Verification status updated to ${status}`,
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update verification status',
                variant: 'destructive'
            });
        }
    };

    const handleUpdateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
        console.log('Updating status for user:', userId, 'to:', status);
        try {
            await updateUser(userId, { status });

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userId
                        ? { ...user, status }
                        : user
                )
            );

            toast({
                title: 'Success',
                description: `User status updated to ${status}`,
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user status',
                variant: 'destructive'
            });
        }
    };

    const handleViewDetails = (user: UserWithDetails) => {
        console.log('Opening modal for user:', user);
        console.log('Raw user data:', JSON.stringify(user, null, 2));

        // Clean up the user object to avoid React rendering errors
        const cleanUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            profileCompleted: user.profileCompleted || false,
            phone: user.phone,
            location: user.location,
            // Handle company field - extract string from object if needed
            // company: typeof user.company === 'object' ? user.company?.name || user.company?.title : user.company,
            verificationStatus: user.verificationStatus || 'none',
            verificationDetails: user.verificationDetails || {},
            appointments: user.appointments || [],
            createdAt: user.createdAt
        };

        console.log('Cleaned user data:', cleanUser);

        setSelectedUser(cleanUser);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        console.log('Closing modal');
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleExportData = () => {
        if (filteredUsers.length === 0) {
            toast({
                title: 'No data',
                description: 'No users to export',
                variant: 'destructive'
            });
            return;
        }

        const exportData = filteredUsers.map(user => ({
            Name: user.name,
            Email: user.email,
            Role: user.role,
            Status: user.status,
            'Verification Status': user.verificationStatus || 'none',
            'Phone Number': user.phone || 'N/A',
            Location: user.location || 'N/A',
            Company: user.company || 'N/A',
            'Profile Completed': user.profileCompleted ? 'Yes' : 'No',
            'Total Appointments': user.appointments?.length || 0,
            'Created Date': new Date(user.createdAt).toLocaleDateString()
        }));

        const csvContent = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification_users_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Exported',
            description: `Exported ${filteredUsers.length} users to CSV`,
            variant: 'default'
        });
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getAppointmentStatus = (appointments: any[]) => {
        const upcoming = appointments?.filter(a => {
            try {
                return new Date(a.appointmentDate) > new Date() && a.status === 'confirmed';
            } catch {
                return false;
            }
        }).length || 0;

        const completed = appointments?.filter(a => a.status === 'completed').length || 0;
        return { upcoming, completed };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading verification data...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Verification Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage user verification status and appointments
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadUsers}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={handleExportData}
                            disabled={filteredUsers.length === 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Fully Verified</p>
                                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Partially Verified</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Not Verified</p>
                                <p className="text-2xl font-bold text-red-600">{stats.notVerified}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">With Appointments</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.withAppointments}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Search Users
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name, email, phone, or company..."
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Role
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Roles</option>
                                <option value="candidate">Candidate</option>
                                <option value="freelancer">Freelancer</option>
                                <option value="company">Company</option>
                                <option value="organization">Organization</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Verification Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Verification
                            </label>
                            <select
                                value={verificationFilter}
                                onChange={(e) => setVerificationFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="full">Fully Verified</option>
                                <option value="partial">Partially Verified</option>
                                <option value="none">Not Verified</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Role & Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Verification
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Appointments
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                                <p className="text-lg font-medium">No users found</p>
                                                <p className="text-sm mt-2">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => {
                                        const appointmentStatus = getAppointmentStatus(user.appointments || []);

                                        return (
                                            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                            <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </div>
                                                            {user.phone && (
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {user.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                                                user.role === 'company' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                                    user.role === 'organization' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            {user.role}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(user.status)}`}>
                                                            {user.status}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <VerificationBadge
                                                            status={user.verificationStatus || 'none'}
                                                            showText
                                                            size="sm"
                                                        />
                                                        {user.profileCompleted ? (
                                                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Profile Complete
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                                Profile Incomplete
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Total: {user.appointments?.length || 0}
                                                        </div>
                                                        {appointmentStatus.upcoming > 0 && (
                                                            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                                                                <Clock className="w-4 h-4 mr-2" />
                                                                Upcoming: {appointmentStatus.upcoming}
                                                            </div>
                                                        )}
                                                        {appointmentStatus.completed > 0 && (
                                                            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Completed: {appointmentStatus.completed}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(user)}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Details
                                                        </button>

                                                        {/* Quick verification actions */}
                                                        <div className="relative group">
                                                            <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1 text-sm transition-colors">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => handleUpdateVerification(user._id, 'full')}
                                                                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Mark Fully Verified
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateVerification(user._id, 'partial')}
                                                                        className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <AlertCircle className="w-4 h-4" />
                                                                        Mark Partially Verified
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateVerification(user._id, 'none')}
                                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                        Remove Verification
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700 dark:text-gray-400">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
                                    <span className="font-medium">{filteredUsers.length}</span> users
                                </div>

                                <div className="flex items-center space-x-2">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={5}>5 per page</option>
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>

                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ChevronsLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ChevronsRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* USER DETAILS MODAL - ADD THIS AT THE BOTTOM */}
            <UserDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                user={selectedUser}
                onUpdateVerification={handleUpdateVerification}
                onUpdateUserStatus={handleUpdateUserStatus}
            />
        </AdminLayout>
    );
};

export default AdminVerificationPage;