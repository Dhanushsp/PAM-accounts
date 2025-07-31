import React, { useEffect, useState } from 'react'; 
import { View, Text, TextInput, ScrollView, TouchableOpacity, BackHandler, Alert, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import apiClient from '../../lib/axios-config';
import { API_BASE_URL } from '../../lib/config';
import AddCustomerPopup from '../components/AddCustomerPopup';
import AddProductPopup from '../components/AddProductPopup';
import AddSale from '../components/AddSale';
import CustomerSalesModal from '../components/CustomerSalesModal';
import SideNav from '../components/SideNav';
import Products from './Products';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AddExpensePopup from '../components/AddExpensePopup';
import CustomersPage from './Customers';
import Expenses from './Expenses';
import GeminiVoiceChatbot from '../components/GeminiVoiceChatbot';
import { useSync } from '../lib/useSync';
import { getPendingActions, saveData, getData, addPendingAction, KEYS } from '../lib/storage';
import { getToken } from '../lib/auth';
import NetInfo from '@react-native-community/netinfo';
import Purchase from './Purchase';
import PersonalFinance from './PersonalFinance';
import Sales from './Sales';
import DatePicker from '../components/DatePicker';
import { StyleSheet } from 'react-native';

interface Customer {
  _id: string;
  name: string;
  credit: number;
  lastPurchase?: string;
  sales?: Array<{ date: string }>;
}

interface HomeProps {
  token: string;
  onLogout: () => void;
}

export default function Home({ token, onLogout }: HomeProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showPopup, setShowPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [showExpensePopup, setShowExpensePopup] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const insets = useSafeAreaInsets();

  const fetchCustomers = async () => {
    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected;
      
      if (isOnline) {
        // Online: fetch from API and cache
      const res = await apiClient.get(`/api/customers?search=${search}`, {
        timeout: 15000, // 15 seconds timeout for customer fetch
      });
      
      // Apply client-side filtering and sorting
      let filteredCustomers = [...res.data];
      
      // Apply date range filtering
      if (filterFromDate || filterToDate) {
        filteredCustomers = filteredCustomers.filter(customer => {
          const latestPurchaseDate = getLatestPurchaseDate(customer);
          if (!latestPurchaseDate) return false; // Exclude customers with no purchases
          
          const purchaseDate = new Date(latestPurchaseDate);
          
          if (filterFromDate && purchaseDate < filterFromDate) {
            return false;
          }
          
          if (filterToDate && purchaseDate > filterToDate) {
            return false;
          }
          
          return true;
        });
      }
      
      // Apply sorting
      if (sort === 'recent') {
        filteredCustomers.sort((a, b) => {
          const dateA = getLatestPurchaseDate(a);
          const dateB = getLatestPurchaseDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // null dates go to the end
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime(); // descending (recent first)
        });
      } else if (sort === 'oldest') {
        filteredCustomers.sort((a, b) => {
          const dateA = getLatestPurchaseDate(a);
          const dateB = getLatestPurchaseDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return -1; // null dates go to the beginning
          if (!dateB) return 1;
          return dateA.getTime() - dateB.getTime(); // ascending (oldest first)
        });
      } else if (sort === 'credit') {
        filteredCustomers.sort((a, b) => b.credit - a.credit); // descending (highest credit first)
      }
      
      setCustomers(filteredCustomers);
        // Cache the data
        await saveData(KEYS.customers, filteredCustomers);

      if (selectedCustomer) {
        const customerRes = await apiClient.get(`/api/customers/${selectedCustomer._id}`);
        setSelectedCustomer(customerRes.data);
        }
      } else {
        // Offline: load from cache
        const cachedCustomers = await getData<Customer[]>(KEYS.customers);
        if (cachedCustomers) {
          // Apply search filter to cached data
          let filteredCustomers = cachedCustomers;
          if (search) {
            filteredCustomers = cachedCustomers.filter(c => 
              c.name.toLowerCase().includes(search.toLowerCase())
            );
          }
          
          // Apply date range filtering to cached data
          if (filterFromDate || filterToDate) {
            filteredCustomers = filteredCustomers.filter(customer => {
              const latestPurchaseDate = getLatestPurchaseDate(customer);
              if (!latestPurchaseDate) return false; // Exclude customers with no purchases
              
              const purchaseDate = new Date(latestPurchaseDate);
              
              if (filterFromDate && purchaseDate < filterFromDate) {
                return false;
              }
              
              if (filterToDate && purchaseDate > filterToDate) {
                return false;
              }
              
              return true;
            });
          }
          
          // Apply sorting to cached data
          if (sort === 'recent') {
            filteredCustomers.sort((a, b) => {
              const dateA = getLatestPurchaseDate(a);
              const dateB = getLatestPurchaseDate(b);
              if (!dateA && !dateB) return 0;
              if (!dateA) return 1;
              if (!dateB) return -1;
              return dateB.getTime() - dateA.getTime();
            });
          } else if (sort === 'oldest') {
            filteredCustomers.sort((a, b) => {
              const dateA = getLatestPurchaseDate(a);
              const dateB = getLatestPurchaseDate(b);
              if (!dateA && !dateB) return 0;
              if (!dateA) return -1;
              if (!dateB) return 1;
              return dateA.getTime() - dateB.getTime();
            });
          } else if (sort === 'credit') {
            filteredCustomers.sort((a, b) => b.credit - a.credit);
          }
          
          setCustomers(filteredCustomers);
        }
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      // Try to load from cache as fallback
      try {
        const cachedCustomers = await getData<Customer[]>(KEYS.customers);
        if (cachedCustomers) {
          setCustomers(cachedCustomers);
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
      Alert.alert('Error', 'Failed to fetch customers. Please check your connection.');
      }
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
          const res = await apiClient.get(`/api/customers/${customerId}`);
      setSelectedCustomer(res.data);
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      Alert.alert('Error', 'Failed to fetch customer details.');
    }
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setIsSideNavOpen(false);
  };

  // Helper function to get the latest purchase date
  const getLatestPurchaseDate = (customer: any) => {
    // First try the lastPurchase field
    if (customer.lastPurchase) {
      return new Date(customer.lastPurchase);
    }
    
    // If no lastPurchase field, try to get from sales array
    if (customer.sales && customer.sales.length > 0) {
      const latestSale = customer.sales.reduce((latest: any, sale: any) => {
        const saleDate = new Date(sale.date);
        const latestDate = new Date(latest.date);
        return saleDate > latestDate ? sale : latest;
      });
      return new Date(latestSale.date);
    }
    
    return null;
  };

  const formatLastSyncTime = (lastSync: Date | null) => {
    if (!lastSync) return 'Not synced yet';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return lastSync.toLocaleDateString();
  };

  // Helper to format customer data for Excel
  const generateExcelData = () => {
    const sheets: { [key: string]: any[][] } = {};
    customers.forEach((customer) => {
      const sheetData: any[][] = [];
      // Header
      sheetData.push([
        'Sale Date',
        'Product Name',
        'Quantity',
        'Price',
        'Total Price',
        'Amount Paid',
        'Payment Method',
        'Credit After Sale',
      ]);
      // Rows
      if (customer.sales && customer.sales.length > 0) {
        customer.sales.forEach((sale: any) => {
          (sale.products || []).forEach((product: any) => {
            sheetData.push([
              sale.date ? new Date(sale.date).toLocaleDateString() : '',
              product.productName || '',
              product.quantity || '',
              product.price || '',
              sale.totalPrice || '',
              sale.amountReceived || '',
              sale.paymentMethod || '',
              sale.updatedCredit || '',
            ]);
          });
        });
      } else {
        sheetData.push(['No sales', '', '', '', '', '', '', '']);
      }
      sheets[customer.name || customer._id] = sheetData;
    });
    return sheets;
  };

  const handleUniversalDownload = async () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // ===== CUSTOMERS SECTION =====
      try {
        const customerSheets = generateExcelData();
        Object.entries(customerSheets).forEach(([sheetName, data]) => {
          // Add a header row to clearly identify this as customer data
          const headerRow = [['CUSTOMER DATA - ' + sheetName.toUpperCase()]];
          const emptyRow = [['']];
          const columnHeaders = [['Customer Name', 'Contact', 'Credit', 'Join Date', 'Last Purchase', 'Total Sales', 'Payment Method', 'Amount Received', 'Updated Credit']];
          
          const organizedData = [...headerRow, emptyRow, columnHeaders, ...data];
          const ws = XLSX.utils.aoa_to_sheet(organizedData);
          
          // Style the header row
          ws['A1'] = { v: 'CUSTOMER DATA - ' + sheetName.toUpperCase(), s: { font: { bold: true, color: { rgb: "2563EB" } } } };
          
          XLSX.utils.book_append_sheet(wb, ws, 'Customers_' + sheetName.substring(0, 25));
        });
      } catch (error) {
        console.error('Error fetching customers:', error);
      }

      // ===== PRODUCTS SECTION =====
      try {
        const productsResponse = await apiClient.get(`/api/products`);
        const productsData = productsResponse.data.map((p: any) => ({
          'Product Name': p.productName,
          'Price per Pack (₹)': p.pricePerPack,
          'Kgs per Pack': p.kgsPerPack,
          'Price per Kg (₹)': p.pricePerKg,
        }));
        
        // Add header information
        const productsHeader = [['PRODUCTS INVENTORY']];
        const productsEmptyRow = [['']];
        const productsSummary = [
          ['Total Products:', productsData.length],
          ['Total Value:', `₹${productsData.reduce((sum: number, p: any) => sum + (p['Price per Pack (₹)'] || 0), 0).toLocaleString()}`]
        ];
        
        const organizedProductsData = [...productsHeader, productsEmptyRow, productsSummary, productsEmptyRow, ...productsData.map(p => Object.values(p))];
        const productsWs = XLSX.utils.aoa_to_sheet(organizedProductsData);
        
        // Style the header
        productsWs['A1'] = { v: 'PRODUCTS INVENTORY', s: { font: { bold: true, color: { rgb: "059669" } } } };
        
        XLSX.utils.book_append_sheet(wb, productsWs, 'Products');
      } catch (error) {
        console.error('Error fetching products:', error);
      }

      // ===== EXPENSES SECTION =====
      try {
        const expensesResponse = await apiClient.get(`/api/expenses`);
        const expensesData = expensesResponse.data.map((e: any) => ({
          'Date': new Date(e.date).toLocaleDateString(),
          'Category': e.category,
          'Subcategory': e.subcategory,
          'Amount (₹)': e.amount,
          'Description': e.description || '',
        }));
        
        // Group expenses by category for summary
        const categorySummary = expensesData.reduce((acc: any, expense: any) => {
          const category = expense['Category'];
          if (!acc[category]) acc[category] = 0;
          acc[category] += expense['Amount (₹)'];
          return acc;
        }, {});
        
        const expensesHeader = [['EXPENSES TRACKING']];
        const expensesEmptyRow = [['']];
        const expensesSummary = [
          ['Total Expenses:', `₹${expensesData.reduce((sum: number, e: any) => sum + e['Amount (₹)'], 0).toLocaleString()}`],
          ['Total Entries:', expensesData.length]
        ];
        
        // Add category breakdown
        const categoryBreakdown = [['Category Breakdown:']];
        Object.entries(categorySummary).forEach(([category, amount]) => {
          categoryBreakdown.push([category, `₹${amount.toLocaleString()}`]);
        });
        
        const organizedExpensesData = [
          ...expensesHeader, 
          expensesEmptyRow, 
          expensesSummary, 
          expensesEmptyRow,
          ...categoryBreakdown,
          expensesEmptyRow,
          ...expensesData.map(e => Object.values(e))
        ];
        const expensesWs = XLSX.utils.aoa_to_sheet(organizedExpensesData);
        
        // Style the header
        expensesWs['A1'] = { v: 'EXPENSES TRACKING', s: { font: { bold: true, color: { rgb: "DC2626" } } } };
        
        XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }

      // ===== PERSONAL FINANCE SECTION =====
      try {
        const [savingsResponse, incomeResponse, payablesResponse, moneyLentResponse] = await Promise.all([
          apiClient.get(`/api/savings-types`),
          apiClient.get(`/api/income-types`),
          apiClient.get(`/api/payable-types`),
          apiClient.get(`/api/money-lent-types`)
        ]);

        // Create a comprehensive Personal Finance sheet
        const personalFinanceData = [];
        
        // Add header
        personalFinanceData.push(['PERSONAL FINANCE OVERVIEW']);
        personalFinanceData.push(['']);
        
        // Savings Section
        if (savingsResponse.data.length > 0) {
          personalFinanceData.push(['SAVINGS ACCOUNTS']);
          personalFinanceData.push(['Type', 'Total Amount (₹)', 'Entries Count']);
          savingsResponse.data.forEach((s: any) => {
            personalFinanceData.push([s.name, s.totalAmount, s.entries?.length || 0]);
          });
          personalFinanceData.push(['Total Savings:', savingsResponse.data.reduce((sum: number, s: any) => sum + s.totalAmount, 0)]);
          personalFinanceData.push(['']);
        }

        // Income Section
        if (incomeResponse.data.length > 0) {
          personalFinanceData.push(['INCOME SOURCES']);
          personalFinanceData.push(['Type', 'Total Amount (₹)', 'Entries Count']);
          incomeResponse.data.forEach((i: any) => {
            personalFinanceData.push([i.name, i.totalAmount, i.entries?.length || 0]);
          });
          personalFinanceData.push(['Total Income:', incomeResponse.data.reduce((sum: number, i: any) => sum + i.totalAmount, 0)]);
          personalFinanceData.push(['']);
        }

        // Payables Section
        if (payablesResponse.data.length > 0) {
          personalFinanceData.push(['PAYABLES']);
          personalFinanceData.push(['Type', 'Total Amount (₹)', 'Entries Count']);
          payablesResponse.data.forEach((p: any) => {
            personalFinanceData.push([p.name, p.totalAmount, p.entries?.length || 0]);
          });
          personalFinanceData.push(['Total Payables:', payablesResponse.data.reduce((sum: number, p: any) => sum + p.totalAmount, 0)]);
          personalFinanceData.push(['']);
        }

        // Money Lent Section
        if (moneyLentResponse.data.length > 0) {
          personalFinanceData.push(['MONEY LENT']);
          personalFinanceData.push(['Type', 'Total Amount (₹)', 'Entries Count']);
          moneyLentResponse.data.forEach((m: any) => {
            personalFinanceData.push([m.name, m.totalAmount, m.entries?.length || 0]);
          });
          personalFinanceData.push(['Total Money Lent:', moneyLentResponse.data.reduce((sum: number, m: any) => sum + m.totalAmount, 0)]);
        }

        const personalFinanceWs = XLSX.utils.aoa_to_sheet(personalFinanceData);
        
        // Style the main header
        personalFinanceWs['A1'] = { v: 'PERSONAL FINANCE OVERVIEW', s: { font: { bold: true, color: { rgb: "7C3AED" } } } };
        
        XLSX.utils.book_append_sheet(wb, personalFinanceWs, 'Personal Finance');
      } catch (error) {
        console.error('Error fetching personal finance data:', error);
      }

      // ===== PURCHASE MANAGEMENT SECTION =====
      try {
        const [vendorsResponse, purchasesResponse] = await Promise.all([
          apiClient.get(`/api/vendors`),
          apiClient.get(`/api/purchases`)
        ]);

        // Create a comprehensive Purchase Management sheet
        const purchaseData = [];
        
        // Add header
        purchaseData.push(['PURCHASE MANAGEMENT']);
        purchaseData.push(['']);
        
        // Vendors Section
        if (vendorsResponse.data.length > 0) {
          purchaseData.push(['VENDORS']);
          purchaseData.push(['Name', 'Contact', 'Credit (₹)', 'Items']);
          vendorsResponse.data.forEach((v: any) => {
            purchaseData.push([v.name, v.contact, v.credit, v.items?.join(', ') || '']);
          });
          purchaseData.push(['Total Vendors:', vendorsResponse.data.length]);
          purchaseData.push(['Total Vendor Credit:', vendorsResponse.data.reduce((sum: number, v: any) => sum + v.credit, 0)]);
          purchaseData.push(['']);
        }

        // Purchases Section
        if (purchasesResponse.data.length > 0) {
          purchaseData.push(['PURCHASE TRANSACTIONS']);
          purchaseData.push(['Date', 'Item', 'Vendor', 'Quantity', 'Unit', 'Price per Unit (₹)', 'Total Price (₹)', 'Amount Paid (₹)', 'Updated Credit (₹)']);
          purchasesResponse.data.forEach((p: any) => {
            purchaseData.push([
              new Date(p.date).toLocaleDateString(),
              p.item,
              p.vendorName,
              p.quantity,
              p.unit,
              p.pricePerUnit,
              p.totalPrice,
              p.amountPaid,
              p.updatedCredit
            ]);
          });
          purchaseData.push(['Total Purchases:', purchasesResponse.data.length]);
          purchaseData.push(['Total Purchase Value:', purchasesResponse.data.reduce((sum: number, p: any) => sum + p.totalPrice, 0)]);
          purchaseData.push(['Total Amount Paid:', purchasesResponse.data.reduce((sum: number, p: any) => sum + p.amountPaid, 0)]);
        }

        const purchaseWs = XLSX.utils.aoa_to_sheet(purchaseData);
        
        // Style the main header
        purchaseWs['A1'] = { v: 'PURCHASE MANAGEMENT', s: { font: { bold: true, color: { rgb: "F59E0B" } } } };
        
        XLSX.utils.book_append_sheet(wb, purchaseWs, 'Purchase Management');
      } catch (error) {
        console.error('Error fetching purchase data:', error);
      }

      // ===== SUMMARY SHEET =====
      try {
        const summaryData = [
          ['PAM ACCOUNTS - COMPLETE DATA SUMMARY'],
          [''],
          ['Generated on:', new Date().toLocaleString()],
          [''],
          ['DATA CATEGORIES:'],
          ['1. Customers - Customer information and sales history'],
          ['2. Products - Product inventory and pricing'],
          ['3. Expenses - Expense tracking and categorization'],
          ['4. Personal Finance - Savings, Income, Payables, and Money Lent'],
          ['5. Purchase Management - Vendors and purchase transactions'],
          [''],
          ['TOTAL SHEETS:', wb.SheetNames.length],
          [''],
          ['Note: Each sheet contains detailed data with proper categorization and summaries.']
        ];

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Style the main header
        summaryWs['A1'] = { v: 'PAM ACCOUNTS - COMPLETE DATA SUMMARY', s: { font: { bold: true, color: { rgb: "1F2937" } } } };
        
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      } catch (error) {
        console.error('Error creating summary sheet:', error);
      }

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileUri = FileSystem.cacheDirectory + 'pam_accounts_complete_data.xlsx';
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Download Complete PAM Accounts Data' });
    } catch (err) {
      Alert.alert('Error', 'Failed to generate or share the file.');
      console.error(err);
    }
  };

  const syncAll = async () => {
    const token = await getToken();
    if (!token) return;
    const pending = await getPendingActions();
    // Sync products
    for (const action of pending.filter(a => a.entity === 'product')) {
      if (action.op === 'add') {
        await apiClient.post(`/api/addproducts`, action.data);
      } else if (action.op === 'edit') {
        await apiClient.put(`/api/products/${action.id}`, action.data);
      } else if (action.op === 'delete') {
                  await apiClient.delete(`/api/products/${action.id}`);
      }
    }
    // Sync customers
    for (const action of pending.filter(a => a.entity === 'customer')) {
      if (action.op === 'add') {
        await apiClient.post(`/api/customers`, action.data);
      } else if (action.op === 'edit') {
        await apiClient.put(`/api/customers/${action.id}`, action.data);
      } else if (action.op === 'delete') {
                  await apiClient.delete(`/api/customers/${action.id}`);
      }
    }
    // Sync expenses
    for (const action of pending.filter(a => a.entity === 'expense')) {
      try {
        if (action.op === 'add') {
          await apiClient.post(`/api/expenses`, action.data);
        } else if (action.op === 'edit') {
          await apiClient.put(`/api/expenses/${action.id}`, action.data);
        } else if (action.op === 'delete') {
          await apiClient.delete(`/api/expenses/${action.id}`);
        }
      } catch (error) {
        console.error('Error syncing expense action:', error);
      }
    }
    
    // Refresh and cache all data
    await fetchCustomers();
    await saveData(KEYS.customers, customers);
  };

  const { isOnline, isSyncing, lastSync, hasPending, handleSync } = useSync(syncAll);

  useEffect(() => {
    fetchCustomers();
  }, [search, sort, filterFromDate, filterToDate]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (isSideNavOpen) {
        setIsSideNavOpen(false);
        return true; // Prevent default back action
      }
      if (currentPage !== 'home') {
        setCurrentPage('home');
        return true; // Prevent default back action
      }
      if (showPopup) {
        setShowPopup(false);
        return true; // Prevent default back action
      }
      if (showProductPopup) {
        setShowProductPopup(false);
        return true; // Prevent default back action
      }
      if (showSalesPopup) {
        setShowSalesPopup(false);
        return true; // Prevent default back action
      }
      if (selectedCustomer) {
        setSelectedCustomer(null);
        return true; // Prevent default back action
      }
      return false; // Allow default back action (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isSideNavOpen, currentPage, showPopup, showProductPopup, showSalesPopup, selectedCustomer]);

  // Show Products page if currentPage is 'products'
  if (currentPage === 'products') {
    return (
      <Products 
        onBack={() => setCurrentPage('home')} 
        token={token} 
      />
    );
  }

  if (currentPage === 'customers') {
    return <CustomersPage token={token} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'expenses') {
    return <Expenses token={token} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'purchase') {
    return <Purchase token={token} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'personal-finance') {
    return <PersonalFinance token={token} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'sales') {
    return <Sales token={token} onBack={() => setCurrentPage('home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
      {/* Modernized Top Navbar */}
      <View style={styles.topNavbar}>
        <Pressable
          onPress={() => setIsSideNavOpen(true)}
          style={styles.menuButton}
        >
          <MaterialIcons name="menu" size={24} color="#2563EB" />
        </Pressable>
        <Text style={styles.appTitle}>
          PAM<Text style={styles.appTitleAccent}>-Accounts</Text>
        </Text>
          {/* Sync Button and Status */}
          <View style={styles.headerButtons}>
        <Pressable
          onPress={onLogout}
          style={styles.logoutButton}
        >
          <MaterialIcons name="logout" size={22} color="#dc2626" />
        </Pressable>
          </View>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by customer name"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />

      {/* Modernized Filter Buttons */}
      <View style={styles.filterButtonsContainer}>
        {['Recent', 'Oldest', 'Credit'].map((type) => {
          const selected = sort === type.toLowerCase();
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setSort(type.toLowerCase())}
              style={[styles.filterButton, selected ? styles.filterButtonSelected : styles.filterButtonUnselected]}
            >
              <Text style={[styles.filterButtonText, selected ? styles.filterButtonTextSelected : styles.filterButtonTextUnselected]}>{type}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Sync Button */}
        <TouchableOpacity
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
          style={[styles.syncButton, { backgroundColor: (!isOnline || isSyncing) ? '#e5e7eb' : '#2563eb' }]}
        >
          <MaterialIcons name="sync" size={20} color={(!isOnline || isSyncing) ? '#94a3b8' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      {/* <View className="flex-row justify-center mb-3">
        <Text style={{ fontSize: 12, color: '#64748b' }}>
          {isSyncing ? 'Syncing...' :
            (!hasPending && isOnline && lastSync && (Date.now() - lastSync.getTime() < 60000)) ? 'Up to date' :
            formatLastSyncTime(lastSync)}
        </Text>
      </View> */}

      {/* Date Filters */}
      {/* <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Date Range:</Text>
        <View style={styles.dateFilterRow}>
          <DatePicker
            value={filterFromDate}
            onDateChange={setFilterFromDate}
            placeholder="From Date"
            style={{ flex: 1, marginRight: 8 }}
          />
          <DatePicker
            value={filterToDate}
            onDateChange={setFilterToDate}
            placeholder="To Date"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
        {(filterFromDate || filterToDate) && (
          <TouchableOpacity
            onPress={() => {
              setFilterFromDate(null);
              setFilterToDate(null);
            }}
            style={{
              backgroundColor: '#F3F4F6',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{
              color: '#6B7280',
              fontSize: 14,
              fontWeight: '500',
            }}>Clear Date Filter</Text>
          </TouchableOpacity>
        )}
        
      </View> */}
      {/* Download and Sync Row */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          onPress={handleUniversalDownload}
          style={styles.downloadButton}
        >
          <FontAwesome5 name="download" size={16} color="#fff" />
          <Text style={styles.downloadButtonText}>All Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowAIChatbot(true)}
          style={styles.aiAssistantButton}
        >
          <FontAwesome5 name="robot" size={16} color="#fff" />
          <Text style={styles.aiAssistantButtonText}>AI Assistant</Text>
        </TouchableOpacity>
      </View>

      

      {/* Customer list */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {customers.length === 0 && (
          <Text style={styles.noCustomersText}>No customers found.</Text>
        )}
        {customers.map((c) => (
          <TouchableOpacity
            key={c._id}
            onPress={() => fetchCustomerDetails(c._id)}
            style={styles.customerCard}
          >
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{c.name}</Text>
              <View style={styles.customerDateRow}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.customerDateText}>
                  {(() => {
                    const latestDate = getLatestPurchaseDate(c);
                    if (latestDate) {
                      return `Last purchase: ${latestDate.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}`;
                    }
                    return 'No purchases yet';
                  })() || 'No purchases yet'}
                </Text>
              </View>
            </View>
            <Text style={styles.customerCredit}>₹{c.credit}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Fixed Bottom Action Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          onPress={() => setShowSalesPopup(true)}
          style={[styles.bottomButton, styles.saleButton]}
        >
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text style={styles.bottomButtonText}>Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleNavigation('sales')}
          style={[styles.bottomButton, styles.viewSalesButton]}
        >
          <FontAwesome5 name="list" size={16} color="#fff" />
          <Text style={styles.bottomButtonText}>View Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowExpensePopup(true)}
          style={[styles.bottomButton, styles.expenseButton]}
        >
          <FontAwesome5 name="money-bill-wave" size={16} color="#fff" />
          <Text style={styles.bottomButtonText}>+ Expense</Text>
        </TouchableOpacity>
        
      </View>

      {/* Popups and SideNav remain unchanged */}
      {showPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}
      
      {showProductPopup && (
        <AddProductPopup
          token={token}
          onClose={() => setShowProductPopup(false)}
          onProductAdded={() => {
            setShowProductPopup(false);
            // Refresh products if needed
          }}
        />
      )}
      
      {showSalesPopup && (
        <AddSale
          token={token}
          onClose={() => setShowSalesPopup(false)}
          onSaleAdded={fetchCustomers}
          onSetSortToRecent={() => setSort('recent')}
        />
      )}

      {showExpensePopup && (
        <AddExpensePopup
          token={token}
          onClose={() => setShowExpensePopup(false)}
        />
      )}

      {showAIChatbot && (
        <GeminiVoiceChatbot
          token={token}
          isVisible={showAIChatbot}
          onClose={() => setShowAIChatbot(false)}
        />
      )}

      {selectedCustomer && (
        <CustomerSalesModal
          customer={selectedCustomer as any}
          onClose={() => setSelectedCustomer(null)}
          onEditSale={(sale) => console.log('Edit sale:', sale)}
          onRefresh={() => fetchCustomerDetails(selectedCustomer._id)}
        />
      )}

      {/* Side Navigation */}
      <SideNav
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        onLogout={onLogout}
        onNavigate={handleNavigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF', // equivalent to bg-blue-50
  },
  content: {
    flex: 1,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Top Navbar Styles
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  menuButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
    elevation: 2,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  appTitleAccent: {
    color: '#3b82f6',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
    elevation: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 120,
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  // Search and Filter Styles
  searchInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#000000',
    backgroundColor: '#ffffff',
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonSelected: {
    backgroundColor: '#2563eb',
    elevation: 2,
  },
  filterButtonUnselected: {
    backgroundColor: '#f3f4f6',
  },
  filterButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterButtonTextSelected: {
    color: '#ffffff',
  },
  filterButtonTextUnselected: {
    color: '#1d4ed8',
  },
  syncButton: {
    borderRadius: 999,
    padding: 10,
  },
  // Action Buttons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  aiAssistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiAssistantButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Customer List Styles
  noCustomersText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
  },
  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 4,
  },
  customerDateText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  customerCredit: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 12,
  },
  // Bottom Button Styles
  saleButton: {
    backgroundColor: '#16a34a',
  },
  viewSalesButton: {
    backgroundColor: '#2563eb',
  },
  expenseButton: {
    backgroundColor: '#dc2626',
  },
  bottomButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});